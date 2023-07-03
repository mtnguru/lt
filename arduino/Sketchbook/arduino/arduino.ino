/*
  *  Arduino WiFi program - arduino.ino
    - send and receive json messages with MQTT client
       - obtain configuration information from LabTime program
       - publish sensor values on change
       - subscribe to output messages and set channel output accordingly
*/

#include <math.h>
//#include <MemoryFree.h>

const char *programId = "arduino.js";
int debugLevel = 0;
unsigned long startTime = 0;
boolean enabled = 1;
int mqttConnected = 0;

///////////// JSON
#include "ArduinoJson.h"
const int jsonDocSize = 2000;       // May 29, 2023 - crashes at 924
StaticJsonDocument<jsonDocSize> jsonDoc;
const int payloadSize = 2000;       // Configuration uses 1404
const int msgSize = 300;
char msg[msgSize];
char logMsg[msgSize];

const int outSize = 300;
char out[outSize];

const int statusSize = 300;
char status[statusSize];

const int tagSize = 200;
const int topicSize = 80;
const int metricIdSize = 40;
const int projectIdSize = 20;
const int clientIdSize = 20;
const int ipSize = 20;
const int valueSize = 10;

char topic[topicSize];
char payload[payloadSize];

char projectId[projectIdSize];
char clientId[clientIdSize];
char ip[ipSize];

///////////// Mqtt server credentials
//const char* mqttIp = "172.16.45.7";   // merlin
const char* mqttIp = "194.195.214.212"; // labtime.org
const char* mqttUser = "data";
const char* mqttPassword = "datawp";
const int mqttPort = 1883;

boolean connected = false;
boolean res = true;   // Error results
boolean haveConfig = false;
enum msgTypeE        { MN,   ME,   MW,   MD };
boolean msgFlags[] = {true, true, true, true, true, true, true};

enum outputTypeE {OUT_LED, OUT_DIGITAL, OUT_LCD};
struct outputS {
  char metricId[metricIdSize];
  char name[metricIdSize];
  outputTypeE channelType;
  char channel[12];
  char tags[tagSize];
  char value[valueSize];
};

enum inputTypeE {IN_MAX6675, IN_BUTTON};
struct inputS {
  char metricId[metricIdSize];
  char name[metricIdSize];
  inputTypeE channelType;
  char channels[12];
  char topic[topicSize];
  char tags[tagSize];
};

const int inputMax = 2;
const int outputMax = 2;
inputS inputA[inputMax];
outputS outputA[outputMax];
int inputN = 0;
int outputN = 0;

///////////// WiFi
#include <ESP8266WiFi.h>
WiFiClient wifiClient;

// ASUS at cabin
const char* wifiSsid = "NachoWiFi";
const char* wifiPassword = "Nemoy1701";

// Century link at cabin
//const char* wifiSsid = "Solvay";
//const char* wifiPassword = "taichi23";

String wifiIP;

///////////// MQTT client
#include <PubSubClient.h>
PubSubClient mqttClient(wifiClient);
String mqttClientId;

//////////// Subscribe and publish topics
// Subscribe
char mqttAllSub[topicSize];       // subscribe to administrator commands to all
char mqttCmdSub[topicSize];       // subscribe to admin commands to IP
char mqttRspSub[topicSize];       // subscribe to administrator responses for this IP
char mqttOutputSub[topicSize];    // subscribe to commands to output channels

// Publish
char mqttCmdPub[topicSize];       // publish command to administrator
char mqttRspPub[topicSize];       // publish responses to administrator commands
char mqttInputPub[topicSize];     // publish channel readings
char mqttCodPub[topicSize];       // publish code debug messages
char mqttMsgPub[topicSize];       // publish messages - notifications, etc.

///////////// Array for calculating running average
const float MV = -999.999;
const int avgN = 2;
float temps[inputMax][avgN];

///////////// MAX6675 thermocouple
#include "max6675.h"
const int thermoDO  = 2;
const int thermoCS  = 4;
const int thermoCLK = 5;
unsigned int sampleInterval = 10000;
MAX6675 tc(thermoCLK, thermoCS, thermoDO);

/////////////
unsigned long lastSample = 0;

#ifdef __arm__
// should use uinstd.h to define sbrk but Due causes a conflict
  extern "C" char* sbrk(int incr);
#else  // __ARM__
  extern char *__brkval;
#endif  // __arm__

String freeMem() {
  const char *f = "freeMem";
  long  fh = ESP.getFreeHeap();
  char  fhc[20];

  ltoa(fh, fhc, 16);
  String freeHeap = String(fhc);
  logit(1,MD,f,"Free memory ",freeHeap.c_str());
  return freeHeap;
}

/*
String freeDude() {
  const char *f = "freeDude";
  char top;
  int free;
#ifdef __arm__
  free = &top - reinterpret_cast<char*>(sbrk(0));
#elif defined(CORE_TEENSY) || (ARDUINO > 103 && ARDUINO != 151)
  free = &top - __brkval;
#else  // __arm__
  free = __brkval ? &top - __brkval : &top - __malloc_heap_start;
#endif  // __arm__

  char  fhc[20];
  itoa(free, fhc, 16);
//String freeHeap = String(fhc);
//logit(0,MD,f,"Free dude ",freeHeap.c_str());
  return "shit";
//return freeHeap;
}
*/


char* lowerCase (char* str) {
  char* s = str;
  while (*str != '\0') { // not the end of the string
    if (*str >= 'A' && *str <= 'Z') {
      *str = *str + 32;
    }
    ++str;
  }
  return s;
}

void logit(int _debugLevel,
           msgTypeE msgType,
           const char *func,
           const char *content,
           const char *more) {
  if (_debugLevel > debugLevel ) return;

  int lenMsg = strlen(func) + strlen(content);
  if (more) {
    lenMsg += strlen(more);
  }
  char typeName[20];
  char *topic;
  switch (msgType) {
    case ME:
      strcpy(typeName,"Error");
      topic = mqttCodPub;
      break;
    case MD:
      strcpy(typeName,"Debug");
      topic = mqttCodPub;
      break;
    case MW:
      strcpy(typeName,"Warning");
      topic = mqttCodPub;
      break;
    case MN:
      strcpy(typeName,"Notifications");
      topic = mqttMsgPub;
      break;
    default:
      strcpy(typeName,"Unknown");
      topic = mqttCodPub;
      break;
  }
  if (lenMsg > 250) {
    snprintf(logMsg, msgSize, "{\"type\": \"%s\",\"function\": \"%s\", \"msg\": \"Message too long\",\"lenmsg\": \"%d\"}", typeName, func, lenMsg);
  } else {
    if (content[0] == '{') {
      snprintf(logMsg, msgSize, "{\"type\": \"%s\",\"function\": \"%s\", \"msg\": %s}", typeName, func, content);
      Serial.println((String)"JSON msg: " + logMsg);
    } else {
      if (more != NULL) {
        snprintf(logMsg, msgSize, "{\"type\": \"%s\",\"function\": \"%s\", \"msg\": \"%s - %s\"}", typeName, func, content, more);
      } else {
        snprintf(logMsg, msgSize, "{\"type\": \"%s\",\"function\": \"%s\", \"msg\": \"%s\"}", typeName, func, content);
      }
      Serial.println((String)"Text msg: " + logMsg);
    }
  }

  if (haveConfig && connected) {
    delay(10);
    mqttClient.publish(topic, logMsg);
  }
}

/**
 * wifiInit - Initialize the wifi, get IP
 */
void wifiInit() {
  Serial.println();
  Serial.println();
  Serial.print("Connecting to wifi ");
  delay(10);

  WiFi.begin(wifiSsid, wifiPassword);
  WiFi.mode(WIFI_STA);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");

  randomSeed(micros());  // Why?
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  wifiIP = WiFi.localIP().toString();
  strcpy(ip, WiFi.localIP().toString().c_str());
  Serial.println((String)"\n   localIP: " + ip);
}

/**
 * findMetric()
 *
 * Given a metric name, look for it in outputA[n].metricId
 */
struct outputS *findMetric(const char *_metricId) {
  const char *f = "findMetric";
  char metricId[metricIdSize];
  strcpy(metricId,_metricId);
  lowerCase(metricId);
  for (int m = 0; m < outputN; m++) {
    if (strcmp(outputA[m].metricId,metricId) == 0){
      logit(2,MD,f,"Metric found",_metricId);
      return &outputA[m];
    }
  }
  logit(0,ME,f,"Metric not found",metricId);
  return NULL;
}

/**
 * getInfluxMetric - Search an influx line for the Metric field
 * Assumed to be the 2nd field in the line.
 */
void getInfluxMetric(const char *payload, char *metric) {
  int b = strcspn (payload, "=");
  int e = strcspn(&payload[b+1], " ,");
  strncpy(metric,&payload[b+1],e);
  metric[e] = '\0';
  logit(2,MD,"getInfluxMetric","Found: ", metric);
  return;
}

/**
 * getInfluxValue() - get the value from a line of Influx line protocol
 */
void getInfluxValue(const char *payload, char *value) {
  int a = strcspn (payload, " ");
  int b = strcspn (&payload[a+1], "=");
  strcpy(value,&payload[a+b+2]);
  logit(2,MD,"getInfluxValue","Found: ", value);
  return;
}

void processOutput (char *_payload) {
  const char *f = "processOutput";
  logit(2,MD,f,"Output request",NULL);

  // influx line protocol, 2nd field is required to be metric
  char metricId[metricIdSize];
  char line[tagSize];
  strcpy(line,_payload);
  getInfluxMetric(line, metricId);
  outputS *output = findMetric(metricId);

  // Exit with error if cannot find the metric
  if (output == NULL) {
    logit(0,ME,f,"Cannot find metric ", metricId);
    return;
  }

  const int channel = atoi(output->channel);
  char value[valueSize];
  getInfluxValue(line,value);
  switch (output->channelType) {
    case OUT_LED:
      break;
    case OUT_DIGITAL:
      if (!strcmp(value, "on") || value[0] == '1') {
        logit(1,MD,f,"digital channel - set true",NULL);
        digitalWrite(channel,LOW);
      } else if (!strcmp(value, "off") || value[0] == '0') {
        logit(1,MD,f,"digital channel - set false",NULL);
        digitalWrite(channel,HIGH);
      } else {
        logit(0,MW,f,"Unknown digital value ",value);
      }
      break;
    case OUT_LCD:
      break;
  }
}

void(* resetFunction) (void) = 0;    // declare reset function @ address 0

void getStatus() {
  const char *f = "getStatus";
  char uptime[20];

  unsigned long timeDiff = (millis() - startTime) / 1000;
  unsigned int seconds = round(timeDiff % 60);
  timeDiff = floor(timeDiff / 60);
  unsigned int minutes = round(timeDiff % 60);
  timeDiff = floor(timeDiff / 60);
  unsigned int hours = round(timeDiff % 24);
  timeDiff = floor(timeDiff / 24);
  unsigned int days = timeDiff;

  snprintf(uptime,20,"%d %d:%d:%d", days, hours, minutes, seconds);

  snprintf(status,statusSize,
    "{\"rsp\": \"requestStatus\", \"clientId\": \"%s\", \"mqttClientId\":\"%s\", \"mqttConnected\": %d, \"enabled\":%d, \"debugLevel\":%d, \"uptime\":\"%s\", \"sampleInterval\":\"%d\"}",
    clientId, mqttClientId.c_str(), mqttConnected, enabled, debugLevel, uptime, sampleInterval);

  logit(2,MD, f, status, NULL);
//char statusLen[10];
//itoa(strlen(status), statusLen, 10);
  mqttClient.publish(mqttRspPub, status);
}

void subscribeTopics() {
  // First unsubscribe in case we're already subscribed
  res = mqttClient.unsubscribe(mqttAllSub);
  res = mqttClient.unsubscribe(mqttCmdSub);
  res = mqttClient.unsubscribe(mqttRspSub);
  res = mqttClient.unsubscribe(mqttOutputSub);

  // Then subscribe
  res = mqttClient.subscribe(mqttAllSub);
  res = mqttClient.subscribe(mqttCmdSub);
  res = mqttClient.subscribe(mqttRspSub);
  res = mqttClient.subscribe(mqttOutputSub);
}

void setConfig(const char *topic,
               StaticJsonDocument<jsonDocSize> jsonDoc) {
  const char *f = "setConfig";
  logit(2,MD, f, "enter", topic);
  freeMem();

  logit(1,MN, f, "Date ", jsonDoc["date"]);
  strcpy(clientId, jsonDoc["clientId"]);
  logit(1,MN, f, "What ",NULL);
  sampleInterval = jsonDoc["status"]["sampleInterval"];
  logit(1,MN, f, "sample ", NULL);
  if (sampleInterval == 0) {
    sampleInterval = 10000;
  }
  logit(1,MN, f, "next ", NULL);
  lastSample = sampleInterval;  // Force immediate read after changing
  enabled = jsonDoc["status"]["enabled"];
  logit(1,MN, f, "next thing ", NULL);
  debugLevel = jsonDoc["status"]["debugLevel"];
  logit(1,MN, f, "next debug ", NULL);

  ///////////// Unsubscribe to response messages
  res = mqttClient.unsubscribe(mqttRspSub);

  ///////////// Subscribe MQTT topics
  strcpy(mqttAllSub,    jsonDoc["topics"]["subscribe"]["all"]);
  strcpy(mqttCmdSub,    jsonDoc["topics"]["subscribe"]["cmd"]);
  strcpy(mqttRspSub,    jsonDoc["topics"]["subscribe"]["rsp"]);
  strcpy(mqttOutputSub, jsonDoc["topics"]["subscribe"]["out"]);

  logit(2,MD, f, "subscribeTopics ", NULL);
  subscribeTopics();

  ///////////// Publish MQTT topics
  strcpy(mqttRspPub,    jsonDoc["topics"]["publish"]["rsp"]);
  strcpy(mqttInputPub,  jsonDoc["topics"]["publish"]["inp"]);
  strcpy(mqttCodPub,    jsonDoc["topics"]["publish"]["cod"]);
  strcpy(mqttMsgPub,    jsonDoc["topics"]["publish"]["msg"]);

  // Loop through metrics, initialize inputA[]
  inputN = 0;
  JsonObject rootInput = jsonDoc["inputs"].as<JsonObject>();
  if (rootInput) {
    logit(2,MD,f,"Process input metrics ",NULL);
    for (JsonPair metric : rootInput) {
      const char *metricId = metric.key().c_str();
      logit(2,MD,f,"Input ",metricId);
      const char *channelType = metric.value()["input"]["channelType"];
      if (strcmp(channelType,"Button") == 0) {
        inputA[inputN].channelType  = IN_BUTTON;
      } else if (strcmp(channelType,"MAX6675") == 0) {
        logit(2,MD,f,"Set channelType as MAX6675 ",NULL);
        inputA[inputN].channelType  = IN_MAX6675;
      } else {
        logit(0,MW, f, "Cannot find input channelType: ", channelType);
      }
      logit(2,MD,f,"Input added ", metricId);
      strcpy(inputA[inputN].tags,      metric.value()["input"]["tags"]);
      strcpy(inputA[inputN].channels,  metric.value()["input"]["channels"]);
      strcpy(inputA[inputN].metricId,  metric.value()["metricId"]);
      logit(2,MD,f,"Input ",inputA[inputN].metricId);
      strcpy(inputA[inputN].name,      metric.value()["name"]);
      logit(2,MD,f,"input channel ", inputA[inputN].channels);
      logit(2,MD,f,"Input ",inputA[inputN].metricId);
      inputN++;
    }
  }

  JsonObject rootOutput = jsonDoc["outputs"].as<JsonObject>();
  if (rootOutput) {
    logit(0,MD,f,"Process output metrics ",NULL);
    for (JsonPair metric : rootOutput) {
      const char *metricId = metric.key().c_str();
      logit(0,MD,f,"Output ",metricId);
      const char *channelType = metric.value()["output"]["channelType"];

      if (strcmp(channelType,"OUT_LED") == 0) {
        outputA[outputN].channelType  = OUT_LED;
      } else if (strcmp(channelType,"LCD") == 0) {
        outputA[outputN].channelType  = OUT_LCD;
      } else if (strcmp(channelType,"digital") == 0) {
        outputA[outputN].channelType  = OUT_DIGITAL;
      } else {
        logit(1,MD, f, "Cannot find output channelType:", channelType);
      }

      logit(0,MD,f,"Output added ", metricId);
      strcpy(outputA[outputN].tags,      metric.value()["output"]["tags"]);
      strcpy(outputA[outputN].channel,   metric.value()["output"]["channel"]);
      strcpy(outputA[outputN].metricId,  metric.value()["metricId"]);
      strcpy(outputA[outputN].name,      metric.value()["name"]);

      const char *channel = outputA[outputN].channel;
      pinMode(atoi(channel), OUTPUT);
      logit(0,MD,f,"Output channel ", channel);
      outputN++;
    }
  }

  haveConfig = true;
  logit(3,MD, f, "exit", NULL);
}

void mqttCB(char* _topic, byte* _payload, unsigned int length) {
  const char *f = "mqttCB";
  char cmd[20];
  char topic[topicSize];
  char outTopic[topicSize];

  // You must immediately copy topic and payload into your own variables,
  // otherwise subsequent mqttClient calls will use the same memory space and cause you much hell.
  strcpy(topic, _topic);
  strncpy(payload, (char *)_payload, length);
  payload[length] = '\0';
  out[0] = '\0';
  strcpy(outTopic, mqttRspPub);

  freeMem();

  logit(1,MD,f,"enter", topic);

  if (payload[0] != '{') {  // if payload is NOT JSON
    if (!strcmp(topic, mqttOutputSub)) {  // Request Output from LabTime
      processOutput(payload);
    }
  } else {                 // if payload is JSON
    DeserializationError err = deserializeJson(jsonDoc, payload);
    if (err) {
      snprintf (msg, msgSize, "ERROR: deserializationJson - %s", err.c_str());
      logit(0,ME, f, msg, NULL);
    }
    logit(1,MD,f,"deserialized ", outTopic);

    if (!strcmp(topic, mqttRspSub)) {
      char rsp[20];
      strcpy(rsp,jsonDoc["rsp"]);
      if (!strcmp(rsp, "requestConfig")) {
        setConfig(topic, jsonDoc);
        freeMem();
      }
    } else if (!strcmp(topic, mqttCmdSub) || !strcmp(topic, mqttAllSub)) {
      strcpy(cmd,jsonDoc["cmd"]);
      if (!strcmp(cmd, "requestReset")) {
        snprintf(out,msgSize,"{\"rsp\":\"%s\", \"clientId\": \"%s\", \"msg\":\"reset requested\"}", cmd, clientId);
        logit(0,MN,f,"Resetting arduino", NULL);
        delay(500);
        resetFunction();
      } else if (!strcmp(cmd, "requestStatus")) {  // Ask arduino for its status
        logit(1,MD,f,"status requested", outTopic);
        getStatus();
      } else if (!strcmp(cmd, "setDebugLevel")) {          // Set debugLevel
        debugLevel = atoi(jsonDoc["debugLevel"]);
        snprintf(out,msgSize,"{\"rsp\":\"%s\", \"clientId\": \"%s\", \"debugLevel\":%d}", cmd, clientId, debugLevel);
        logit(0,MN,f,"set Debug Level", outTopic);
      } else if (!strcmp(cmd, "setEnabled")) {                 // Enabled arduino
        enabled = jsonDoc["enabled"];
        snprintf(out,msgSize,"{\"rsp\":\"%s\", \"clientId\": \"%s\", \"enabled\":%d}", cmd, clientId, enabled);
      } else if (!strcmp(cmd, "setSampleInterval")) {      // Set sample interval
        sampleInterval = atoi(jsonDoc["sampleInterval"]);
        snprintf(out,msgSize,"{\"rsp\":\"%s\", \"clientId\": \"%s\", \"sampleInterval\":%d}", cmd, clientId, sampleInterval);
      }
    }
  }
  if (strlen(out)) {
    logit(1,MD,f,"publish message: outTopic", outTopic);
    mqttClient.publish(outTopic, out);
  }
  freeMem();
}

/**
 * requestConfig - request the configuration for this device
 *
 */
void requestConfig() {
  const char *f = "requestConfig";
  logit(3,MD, f, "enter", NULL);

  snprintf(payload,payloadSize,"{\"cmd\":\"requestConfig\",\"ip\":\"%s\"}", ip );
  mqttClient.publish(mqttCmdPub, payload);
  if (!res) {
    logit(0,ME,f,"Error publishing request in requestConfig", NULL);
  }
  logit(3,MD, f, "exit", NULL);
}

void unsubscribeCB() {
  const char *f = "unsubscribeCB";
  logit(3,MD, f, "howdy", NULL);
}

void mqttConnect() {
  const char *f = "mqttConnect";
  logit(1,MN,f,"enter",NULL);
  mqttClient.setKeepAlive(300);
  mqttClient.setBufferSize(payloadSize);
  int attempts = 0;

  delay(100);

  connected = false;
  while (!mqttClient.connected()) {
    if (mqttClient.connect(mqttClientId.c_str(), mqttUser, mqttPassword)) {
      connected = true;
      mqttConnected++;
      logit(0,MN, f, "Mqtt connected", NULL);
    } else {
      int st = mqttClient.state();
      char ststr[20];
      itoa(st,ststr,10);
      logit(0,ME,f,"mqttClient.connected returned false   state: ",ststr);
      delay(100);

      attempts++;
      if (attempts == 10) {
        logit(0,ME,f,"mqttClient.connected returned false 10 times - reset the arduino",NULL);
        delay(500);
        resetFunction();
      }
    }
  }
}

void sampleInputs() {
  // Loop through the inputs, read value, and post to MQTT
  const char *f = "sampleInputs";
  logit(3,MD,f,"sampleInputs enter ", NULL);
  for (int m = 0; m < inputN; m++) {
    inputS *input = &inputA[m];
    logit(2,MD,f,"sample ", input->metricId);
    float value = MV;
    switch (input->channelType) {
      case IN_BUTTON:
        break;
      case IN_MAX6675:
        logit(1,MD,f,"check temperature", NULL);
        value = tc.readFahrenheit();
        if (value > 500) {
          snprintf(out, outSize, "temperature out of range: %f", value);
          logit(0,ME,f,out, NULL);
        } else {
          snprintf(out, outSize, "value=%g", value);
          logit(1,MD,f,"temperature acquired", out);

          snprintf(out, outSize, "%s value=%g", input->tags, value);
          mqttClient.publish(mqttInputPub, out);
        }
        break;
    }
  }
  freeMem();
}

void setup() {
  const char *f = "setup";
  Serial.begin(115200);
  startTime = millis();

  strcpy(projectId, "unknown");
  randomSeed(micros());
  mqttClientId = "arduino_" + String(random(0xffff), HEX);

  wifiInit();

  logit(2,MD,f,"Assign mqtt*Pub paths",mqttCmdPub);


  logit(1,MD,f,"Init MQTT server",mqttIp);
  mqttClient.setServer(mqttIp, mqttPort);
  mqttClient.setCallback(mqttCB);
  mqttConnect();

  strcpy(mqttCmdPub, "a/admin/cmd/administrator");

  logit(2,MD,f,"Subscribe to admin response messages ", NULL);
  snprintf(mqttRspSub, topicSize, "a/admin/rsp/%s", ip);   // admin responses
  res = mqttClient.subscribe(mqttRspSub);

  requestConfig();
  delay(500);
}

void loop() {
  const char *f = "loop";
  logit(3,MD,f,"Start loop",NULL);

  if (WiFi.status() != WL_CONNECTED) {
    logit(0,ME,f,"WiFi not connected - reset the arduino",NULL);
    delay(500);
    resetFunction();
  }

  if (mqttClient.state() != 0) {
    mqttConnect();
    subscribeTopics();
  }

  mqttClient.loop();
  if (haveConfig && enabled) {
    unsigned long now = millis();
    if (now - lastSample > sampleInterval) {
      logit(3,MD,f,"do Sample start",NULL);
      lastSample = now;
      sampleInputs();
      logit(3,MD,f,"do Sample done",NULL);
    }
  } else {
    //  logit(2,MD, f,"WARNING: Config not read",NULL);
  }
}