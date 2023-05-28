/*
  *  Arduino WiFi program - arduino.ino
    - send and receive json messages with MQTT client
       - obtain configuration information from LabTime program
       - publish sensor values on change
       - subscribe to output messages and set channel output accordingly
*/

#include <math.h>

const char *programId = "arduino.js";
int debugLevel = 0;
unsigned long startTime = 0;
boolean enabled = true;
int mqttConnected = 0;

///////////// JSON
#include "ArduinoJson.h"
const int jsonDocSize = 3000;
StaticJsonDocument<jsonDocSize> jsonDoc;
const int payloadSize = 2000;

const int msgSize = 300;
char logMsg[msgSize];

const int tagSize = 200;
const int topicSize = 50;
const int metricIdSize = 40;
const int projectIdSize = 20;
const int clientIdSize = 20;
const int ipSize = 20;
const int valueSize = 20;

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

const int inputMax = 3;
const int outputMax = 3;
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
char mqttAdminAllSub[topicSize];       // subscribe to administrator commands to all
char mqttAdminCmdSub[topicSize];        // subscribe to admin commands to IP
char mqttAdminRspSub[topicSize];  // subscribe to administrator responses for this IP
char mqttOutputSub[topicSize];         // subscribe to commands to output channels

// Publish
char mqttAdminCmdPub[topicSize];       // publish command to administrator
char mqttAdminRspPub[topicSize];       // publish responses to administrator commands
char mqttInputPub[topicSize];          // publish channel readings
char mqttCodPub[topicSize];            // publish code debug messages
char mqttMsgPub[topicSize];            // publish messages - notifications, etc.

///////////// Array for calculating running average
const float MV = -999.999;
const int avgN = 2;
float temps[inputMax][avgN];

///////////// MAX6675 thermocouple
#include "max6675.h"
const int thermoDO  = 2;
const int thermoCS  = 4;
const int thermoCLK = 5;
unsigned int sampleInterval = 5000;
MAX6675 tc(thermoCLK, thermoCS, thermoDO);

/////////////
unsigned long lastSample = 0;

#ifdef __arm__
// should use uinstd.h to define sbrk but Due causes a conflict
  extern "C" char* sbrk(int incr);
#else  // __ARM__
  extern char *__brkval;
#endif  // __arm__

String freeMemory() {
  const char *f = "freeMemory";
  long  fh = ESP.getFreeHeap();
  char  fhc[20];

  ltoa(fh, fhc, 16);
  String freeHeap = String(fhc);
  logit(3,MD,f,"Free memory ",freeHeap.c_str());
  return freeHeap;
}

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
      strcpy(typeName,"Notify");
      topic = mqttMsgPub;
      break;
    default:
      strcpy(typeName,"Unknown");
      topic = mqttCodPub;
      break;
  }
  if (lenMsg > 250) {
    snprintf(logMsg, msgSize, "{\"Type\": \"%s\",\"Func\": \"%s\", \"Msg\": \"Message too long\",\"lenmsg\": \"%d\"}", typeName, func, lenMsg);
  } else {
    if (content[0] == '{') {
      snprintf(logMsg, msgSize, "{\"Type\": \"%s\",\"Func\": \"%s\", \"Msg\": %s}", typeName, func, content);
      Serial.println((String)"JSON msg: " + logMsg);
    } else {
      if (more != NULL) {
        snprintf(logMsg, msgSize, "{\"Type\": \"%s\",\"Func\": \"%s\", \"Msg\": \"%s - %s\"}", typeName, func, content, more);
      } else {
        snprintf(logMsg, msgSize, "{\"Type\": \"%s\",\"Func\": \"%s\", \"Msg\": \"%s\"}", typeName, func, content);
      }
      Serial.println((String)"Text msg: " + logMsg);
    }
  }

  if (haveConfig && connected) {
    delay(10);
    mqttClient.publish(topic, logMsg, strlen(logMsg) + 1);
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

void processOutput (char *paystr) {
  const char *f = "processOutput";
  logit(2,MD,f,"Output request",NULL);

  // influx line protocol, 2nd field is required to be metric
  char metricId[metricIdSize];
  char line[tagSize];
  strcpy(line,paystr);
  getInfluxMetric(line, metricId);
  outputS *output = findMetric(metricId);

  // Exit with error if cannot find the metric
  if (output == NULL) {
    logit(0,ME,f,"Cannot find metric ", metricId);
    return;
  }

  const int channel = atoi(output->channel);
  char value[valueSize];
  strcpy(line,paystr);
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

void(* resetFunc) (void) = 0; //declare reset function @ address 0

void getStatus() {
  const char *f = "getStatus";

  unsigned long timeDiff = (millis() - startTime) / 1000;
  unsigned int seconds = round(timeDiff % 60);
  timeDiff = floor(timeDiff / 60);
  unsigned int minutes = round(timeDiff % 60);
  timeDiff = floor(timeDiff / 60);
  unsigned int hours = round(timeDiff % 24);
  timeDiff = floor(timeDiff / 24);
  unsigned int days = timeDiff;

  char uptime[30];
  snprintf(uptime,30,"%d %d:%d:%d", days, hours, minutes, seconds);

  char enabledStatus[10];
  if (enabled) {
    strcpy(enabledStatus,"true");
  } else {
    strcpy(enabledStatus,"false");
  }

  snprintf(payload,payloadSize,
    "{\"rsp\": \"requestStatus\", \"clientId\": \"%s\", \"mqttClientId\":\"%s\", \"mqttConnected\": \"%d\", \"enabled\":\"%s\", \"debugLevel\":\"%d\",\"uptime\":\"%s\"}",
    clientId, mqttClientId.c_str(), mqttConnected, enabledStatus, debugLevel, uptime);

  logit(2,MD, f, payload, NULL);
  mqttClient.publish(mqttAdminRspPub, payload);
}

void subscribeTopics() {
  // First unsubscribe in case we're already subscribed
  res = mqttClient.unsubscribe(mqttAdminAllSub);
  res = mqttClient.unsubscribe(mqttAdminCmdSub);
  res = mqttClient.unsubscribe(mqttAdminRspSub);
  res = mqttClient.unsubscribe(mqttOutputSub);

  // Then subscribe
  res = mqttClient.subscribe(mqttAdminAllSub);
  res = mqttClient.subscribe(mqttAdminCmdSub);
  res = mqttClient.subscribe(mqttAdminRspSub);
  res = mqttClient.subscribe(mqttOutputSub);
}

void setConfig(const char *topic,
               StaticJsonDocument<jsonDocSize> jsonDoc) {
  const char *f = "setConfig";
  logit(2,MD, f, "enter", topic);
  freeMemory();

  logit(1,MN, f, "Date ", jsonDoc["date"]);
  strcpy(clientId, jsonDoc["clientId"]);
  sampleInterval = jsonDoc["sampleInterval"];
  lastSample = sampleInterval;

  ///////////// Unsubscribe to response messages
  res = mqttClient.unsubscribe(mqttAdminRspSub);

  ///////////// Subscribe MQTT topics
  strcpy(mqttAdminAllSub, jsonDoc["topics"]["subscribe"]["all"]);
  strcpy(mqttAdminCmdSub, jsonDoc["topics"]["subscribe"]["cmd"]);
  strcpy(mqttAdminRspSub, jsonDoc["topics"]["subscribe"]["rsp"]);
  strcpy(mqttOutputSub,   jsonDoc["topics"]["subscribe"]["out"]);

  logit(0,MD, f, "subscribeTopics ", NULL);
  subscribeTopics();
  logit(0,MD, f, "done subscribeTopics ", NULL);

  ///////////// Publish MQTT topics
  strcpy(mqttAdminRspPub,  jsonDoc["topics"]["publish"]["rsp"]);
  strcpy(mqttInputPub,     jsonDoc["topics"]["publish"]["inp"]);
  strcpy(mqttCodPub,       jsonDoc["topics"]["publish"]["cod"]);
  strcpy(mqttMsgPub,       jsonDoc["topics"]["publish"]["msg"]);

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
      strcpy(inputA[inputN].name,      metric.value()["name"]);
      logit(2,MD,f,"input channel ", inputA[inputN].channels);
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

void mqttCallback(char* _topic, byte* payload, unsigned int length) {
  const char *f = "mqttCallback";
  // You must immediately copy topic and payload into your own variables,
  // otherwise subsequent mqttClient calls will use the same memory space and cause you much hell.
  char topic[topicSize];
  char paystr[payloadSize];
  strcpy(topic, _topic);
  strncpy(paystr, (char *)payload, length);
  paystr[length] = '\0';
  freeMemory();

  logit(2,MD,f,"enter", topic);

  if (paystr[0] != '{') {  // if payload is NOT JSON
    if (!strcmp(topic, mqttOutputSub)) {  // Request Output from LabTime
      processOutput(paystr);
    }
  } else {                 // if payload is JSON
    DeserializationError err = deserializeJson(jsonDoc, paystr);
    if (err) {
      char msg[300];
      snprintf (msg, msgSize, "ERROR: deserializationJson - %s", err.c_str());
      logit(0,ME, f, msg, NULL);
    }
    logit(3,MD, f, "deserialized ",NULL);

    if (!strcmp(topic, mqttAdminRspSub)) {
      char rsp[20];
      strcpy(rsp,jsonDoc["rsp"]);
      if (!strcmp(rsp, "requestConfig")) {
        setConfig(topic, jsonDoc);
        freeMemory();
      }
    } else if (!strcmp(topic, mqttAdminCmdSub) || !strcmp(topic, mqttAdminAllSub)) {
      char cmd[20];
      strcpy(cmd,jsonDoc["cmd"]);
      if (!strcmp(cmd, "requestReset")) {
        logit(0,MN,f,"Resetting arduino", NULL);
        delay(500);
        resetFunc();
      } else if (!strcmp(cmd, "requestStatus")) {  // Ask arduino for its status
        logit(1,MN,f,"Get status", NULL);
        getStatus();
      } else if (!strcmp(cmd, "setDebugLevel")) {          // Set debugLevel
        debugLevel = atoi(jsonDoc["debugLevel"]);
        logit(0,MN,f,"Set debug level", jsonDoc["debugLevel"]);
      } else if (!strcmp(cmd, "setEnabled")) {                 // Enabled arduino
        char enabledStatus[10];
        strcpy(enabledStatus, jsonDoc["enabled"]);
        if (!strcmp(enabledStatus,"true")) {
          if (enabled) {
            logit(0,MN,f,"Already enabled", NULL);
          } else {
            enabled = true;
            logit(0,MN,f,"Enable arduino", jsonDoc["debugLevel"]);
          }
        } else {
          if (!enabled) {
            logit(0,MN,f,"Already disabled", NULL);
          } else {
            enabled = false;
            logit(0,MN,f,"Disable arduino", jsonDoc["debugLevel"]);
          }
        }
      } else if (!strcmp(cmd, "setSampleInterval")) {      // Set sample interval
        sampleInterval = atoi(jsonDoc["sampleInterval"]);
        logit(0,MN,f,"Set sampling interval", jsonDoc["sampleInterval"]);
      }
    }
  }
  freeMemory();
}

/**
 * requestConfig - request the configuration for this device
 *
 */
void requestConfig() {
  const char *f = "requestConfig";
  logit(3,MD, f, "enter", NULL);

  snprintf(payload,payloadSize,"{\"cmd\":\"requestConfig\",\"ip\":\"%s\"}", ip );
  mqttClient.publish(mqttAdminCmdPub, payload);
  if (!res) {
    logit(0,ME,f,"Error publishing request in requestConfig", NULL);
  }
  logit(3,MD, f, "exit", NULL);
}

void unsubscribeCallback() {
  const char *f = "unsubscribeCallback";
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
        resetFunc();
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
        value = tc.readFahrenheit();
        if (value > 500) {
          snprintf(payload, payloadSize, "temperature out of range: %f", value);
          logit(0,ME,f,payload, NULL);
        } else {
          snprintf(payload, payloadSize, "%s value=%g", input->tags, value);
          logit(1,MD,f,"temperature acquired", payload);
          mqttClient.publish(mqttInputPub, payload);
        }
        break;
    }
  }
  freeMemory();
}

void setup() {
  const char *f = "setup";
  Serial.begin(115200);
  startTime = millis();

  strcpy(projectId, "unknown");
  randomSeed(micros());
  mqttClientId = "arduino_" + String(random(0xffff), HEX);

  wifiInit();

  logit(2,MD,f,"Assign mqttAdmin*Pub paths",mqttAdminCmdPub);


  logit(1,MD,f,"Init MQTT server",mqttIp);
  mqttClient.setServer(mqttIp, mqttPort);
  mqttClient.setCallback(mqttCallback);
  mqttConnect();

  strcpy(mqttAdminCmdPub, "a/cmd/administrator");

  logit(2,MD,f,"Subscribe to admin response messages ", NULL);
  snprintf(mqttAdminRspSub, topicSize, "a/rsp/%s", ip);   // admin responses
  res = mqttClient.subscribe(mqttAdminRspSub);

  requestConfig();
  delay(500);
}

void loop() {
  const char *f = "loop";
  logit(3,MD,f,"Start loop",NULL);

  if (WiFi.status() != WL_CONNECTED) {
    logit(0,ME,f,"WiFi not connected - reset the arduino",NULL);
    delay(500);
    resetFunc();
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