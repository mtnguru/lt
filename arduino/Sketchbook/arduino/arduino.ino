/*
  *  Arduino WiFi program - arduino.ino
    - send and receive json messages with MQTT client
       - obtain configuration information from LabTime program
       - publish sensor values on change
       - subscribe to output messages and set channel output accordingly
*/

const char *programId = "arduino.js";
int debugLevel = 0;
unsigned long startTime = 0;
boolean sampling = true;

///////////// JSON
#include "ArduinoJson.h"
const int jsonDocSize = 4000;

const int tagSize = 200;
const int topicSize = 40;
const int metricIdSize = 24;
const int projectIdSize = 16;
const int clientIdSize = 16;
const int ipSize = 20;
const int valueSize = 20;
const int msgSize = 300;
const int payloadSize = 2000;

char msg[msgSize];
char logMsg[msgSize];
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
  outputTypeE type;
  char channel[12];
  char tags[tagSize];
  char value[valueSize];
};

enum inputTypeE {IN_MAX6675, IN_BUTTON};
struct inputS {
  char metricId[metricIdSize];
  char name[metricIdSize];
  inputTypeE type;
  char topic[topicSize];
  char tags[tagSize];
  char channels[12];
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
//const char* wifiSsid = "Nacho";
//const char* wifiPassword = "Nemoy1701";
const char* wifiSsid = "NachoWiFi";
const char* wifiPassword = "Nemoy1701";
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
char mqttAdminIpSub[topicSize];        // subscribe to admin commands to IP
char mqttAdminClientidSub[topicSize];  // subscribe to admin commands to clientId
char mqttAdminResponseSub[topicSize];  // subscribe to administrator responses for this IP
char mqttOutputSub[topicSize];

// Publish
char mqttAdminCmdPub[topicSize];          // publish command to administrator
char mqttAdminRspPub[topicSize];          // publish responses to administrator commands
char mqttInputPub[topicSize];
char mqttCodePub[topicSize];
char mqttMsgPub[topicSize];

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
// int sampleNum = 0;

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

  ltoa(fh, fhc, 10);
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
//if (!msgFlags[msgType]) return;   // If logging is turned off for this message type return.
  if (_debugLevel > debugLevel ) return;

  char typeName[20];
  char *topic;
  switch (msgType) {
    case ME:
      strcpy(typeName,"Error");
      topic = mqttCodePub;
      break;
    case MD:
      strcpy(typeName,"Debug");
      topic = mqttCodePub;
      break;
    case MW:
      strcpy(typeName,"Warning");
      topic = mqttCodePub;
      break;
    case MN:
      strcpy(typeName,"Notify");
      topic = mqttMsgPub;
      break;
    default:
      strcpy(typeName,"Unknown");
      topic = mqttCodePub;
      break;
  }

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

  if (haveConfig && mqttClient.connected()) {
    delay(10);
    Serial.println((String)"logit connected: " + logMsg);
    mqttClient.publish(topic, logMsg);
  }
}

/**
 * gettoken - extract the nth field using '/' for delimeter
 */
 /*
int gettoken(char *str, char *token, int pos) {
  const char del = '/';
  int lenStr = strlen(str);

  token[0] = '\0';
  int lenToken = -1;

  int f = 0;
  bool infld = (pos == 0) ? true : false;
  if (str[0] == del && infld) {
    token[lenToken] = '\0';
    return lenToken + 1;
  }
  for (int i = 0; i < lenStr; i++) {
    if (str[i] == del) {
      f++;
      if (infld) {
        token[lenToken] == '\0';
        return lenToken+1;
      } else if (f == pos) {
        infld = true;
      }
    } else {
      if (infld) {
        token[++lenToken] = str[i];
        token[lenToken + 1] = '\0';
      }
    }
  }

  if (infld) {
    token[++lenToken + 1] = '\0';
    return lenToken;
  } else {
    return lenToken;
  }
}
*/

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
struct outputS *findMetric(const char *metricId) {
  const char *f = "findMetric";
  char name[metricIdSize];
  strcpy(name,metricId);
  lowerCase(name);
  for (int m = 0; m < outputN; m++) {
    if (strcmp(outputA[m].metricId,name) == 0){
      logit(2,MD,f,"Metric found",metricId);
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
//const char tok[] = ",";
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
//const char tok[] = ",";
  int a = strcspn (payload, " ");
  int b = strcspn (&payload[a+1], "=");
  strcpy(value,&payload[a+b+2]);
  logit(2,MD,"getInfluxValue","Found: ", value);
  return;
}

void processOutput (char *paystr) {
  const char *f = "processOutput";
  logit(2,MD,f,"incoming control request - output",NULL);
  // influx line protocol, 2nd field is required to be metric
  char metricId[metricIdSize];
  char tmp[80];
  strcpy(tmp,paystr);
  logit(2,MD, f,"get influx metric ",tmp);
  getInfluxMetric(tmp, metricId);
  outputS *output = findMetric(metricId);

  // Exit with error if cannot find the metric
  if (output == NULL) {
    logit(0,ME,f,"Cannot find metric ", metricId);
    return;
  }

  const int channel = atoi(output->channel);
  char value[valueSize];
  strcpy(tmp,paystr);
  getInfluxValue(tmp,value);
  Serial.println((String)"Got Value " + value + " " + output->type);
//snprintf(msg, msgSize, "output value %s  type %d", value, output->type);
//logit(1,MD,f,msg,NULL);
  switch (output->type) {
    case OUT_LED:
      break;
    case OUT_DIGITAL:
      if (value[0] == '1') {
        logit(2,MD,f,"digital channel - set true",NULL);
        digitalWrite(channel,HIGH);
      } else if (value[0] == '0') {
        logit(2,MD,f,"digital channel - set false",NULL);
        digitalWrite(channel,LOW);
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

  unsigned long seconds = (millis() - startTime) / 1000;
  unsigned long hours = (millis() - startTime) / 1000 / 3600;
  char samplingStatus[10];

  if (sampling) {
    strcpy(samplingStatus,"true");
  } else {
    strcpy(samplingStatus,"false");
  }

  snprintf(payload,payloadSize,
    "{\"clientId\":\"%s\", \"sampling\":\"%s\", \"debugLevel\":\"%d\",\"uptime seconds\":\"%ld\",\"uptime hours\":\"%ld\"}",
    clientId, samplingStatus, debugLevel, seconds, hours );

  logit(2,MD, f, payload, NULL);
  mqttClient.publish(mqttAdminRspPub, payload);
}

void setConfig(char *topic,
               StaticJsonDocument<jsonDocSize> jsonDoc) {
  const char *f = "setConfig";
  logit(2,MD, f, "enter", topic);
  freeMemory();

  logit(1,MN, f, "Date ", jsonDoc["date"]);
  strcpy(clientId, jsonDoc["clientId"]);
  sampleInterval = jsonDoc["sampleInterval"];
  lastSample = sampleInterval;

  ///////////// Subscribe MQTT topics
  strcpy(mqttOutputSub, jsonDoc["topics"]["subscribe"]["adm"]);
  res = mqttClient.subscribe(mqttOutputSub);
  if (!res) { logit(0,ME, f, "Error subscribing", NULL); }

  strcpy(mqttOutputSub, jsonDoc["topics"]["subscribe"]["out"]);
  res = mqttClient.subscribe(mqttOutputSub);
  if (!res) { logit(0,ME, f, "Error subscribing", NULL); }

  ///////////// Publish MQTT topics
  strcpy(mqttInputPub,  jsonDoc["topics"]["publish"]["inp"]);
  strcpy(mqttCodePub,   jsonDoc["topics"]["publish"]["cod"]);
  strcpy(mqttMsgPub,    jsonDoc["topics"]["publish"]["msg"]);

  // Loop through metrics, initialize inputA[]
  inputN = 0;
  logit(2,MD,f,"Process input metrics ",NULL);
  JsonObject rootMetric = jsonDoc["inputs"].as<JsonObject>();
  logit(3,MD,f,"Input for loop ",NULL);
  for (JsonPair metric : rootMetric) {
    const char *metricId = metric.key().c_str();
    logit(2,MD,f,"Input ",metricId);
    const char *type = metric.value()["input"]["type"];
    if (strcmp(type,"Button") == 0) {
      inputA[inputN].type  = IN_BUTTON;
    } else if (strcmp(type,"MAX6675") == 0) {
      logit(2,MD,f,"Set type as MAX6675 ",NULL);
      inputA[inputN].type  = IN_MAX6675;
    } else {
      logit(0,MW, f, "Cannot find input type: ", type);
    }
    logit(2,MD,f,"Input added ", metricId);
    strcpy(inputA[inputN].tags,      metric.value()["input"]["tags"]);
    strcpy(inputA[inputN].channels,  metric.value()["input"]["channels"]);
    strcpy(inputA[inputN].metricId,  metric.value()["metricId"]);
    strcpy(inputA[inputN].name,      metric.value()["name"]);
    inputN++;
  }

/*
    logit(1,MD,f,"do Output ",NULL);
    JsonObject outputObject = jsonDoc["metrics"][metricId]["output"];
    if (outputObject) {
      outputA[metricsN].output.have = true;
      // Copy device properties from json to internal array
      const char *type = outputObject["type"];
      const char *channel = outputObject["channel"];
      pinMode(atoi(channel), OUTPUT);
      pinMode(LED_BUILTIN, OUTPUT);
      if (strcmp(type,"OUT_LED") == 0) {
        outputA[metricsN].output.type  = OUT_LED;
      } else if (strcmp(type,"LCD") == 0) {
        outputA[metricsN].output.type  = OUT_LCD;
      } else if (strcmp(type,"digital") == 0) {
        outputA[metricsN].output.type  = OUT_DIGITAL;
      } else {
        logit(1,MD, f, "Cannot find outout type:", type);
      }

      strcpy(outputA[metricsN].output.channel, outputObject["channel"]);
      logit(1,MD,f,"channel ",  outputA[metricsN].output.channel);
    } else {
      metricsA[metricsN].output.have = false;
    }
  }
  */
  haveConfig = true;
  logit(3,MD, f, "exit", NULL);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  const char *f = "mqttCallback";
  StaticJsonDocument<jsonDocSize> jsonDoc;
  logit(3,MD, f, "enter", topic);
  freeMemory();

  char paystr[2000];
  char len[20];
  strncpy(paystr, (char *)payload, length);
  itoa(length, len, 10);
  logit(0,MD,f,"payload length", len);
  paystr[length] = '\0';

//snprintf (msg, msgSize, "  ---- Incoming - %s - %d - %s", topic, length, paystr);
  logit(2,MN,f,paystr, NULL);

  DeserializationError err = deserializeJson(jsonDoc, paystr);
  if (err) {
    snprintf (msg, msgSize, "ERROR: deserializationJson - %s", err.c_str());
    logit(0,ME, f, msg, NULL);
  }
  logit(3,MD, f, "deserialized ",NULL);

  char cmd[20];
  strcpy(cmd,jsonDoc["cmd"]);
//snprintf (msg, msgSize, "  Command %s",cmd);

  if (!strcmp(topic, mqttOutputSub)) {  // Request Output from LabTime
    processOutput(paystr);
  } else if (!strcmp(cmd, "requestConfig")) {
    setConfig(topic, jsonDoc);
    freeMemory();
  } else if (!strcmp(cmd, "requestReset")) {
    logit(0,MN,f,"Resetting arduino", NULL);
    delay(500);
    resetFunc();
  } else if (!strcmp(cmd, "requestStatus")) {  // Ask arduino for its status
    logit(1,MN,f,"Get status", NULL);
    getStatus();
  } else if (!strcmp(cmd, "setDebugLevel")) {          // Set debugLevel
    debugLevel = atoi(jsonDoc["debugLevel"]);
    logit(0,MN,f,"Set debug level", jsonDoc["debugLevel"]);
  } else if (!strcmp(cmd, "startSampling")) {          // Ask arduino to start sampling
    if (sampling) {
      logit(0,MN,f,"Already sampling", NULL);
    } else {
      sampling = true;
      logit(0,MN,f,"Start sampling", jsonDoc["debugLevel"]);
    }
  } else if (!strcmp(cmd, "stopSampling")) {           // Ask arduino to stop sampling
    if (!sampling) {
      logit(0,MN,f,"Already stopped sampling", NULL);
    } else {
      sampling = false;
      logit(0,MN,f,"Stop sampling", jsonDoc["debugLevel"]);
    }
  } else if (!strcmp(cmd, "setSampleInterval")) {      // Set sample interval
    sampleInterval = atoi(jsonDoc["sampleInterval"]);
    logit(0,MN,f,"Set sampling interval", jsonDoc["sampleInterval"]);
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
  logit(0,MN,f,"enter",NULL);
  mqttClient.setKeepAlive(300);
  delay(500);
  if (mqttClient.connect(mqttClientId.c_str(), mqttUser, mqttPassword)) {
    connected = true;
    logit(2,MD, f, "connected", NULL);
    mqttClient.setBufferSize(2000);

  } else {
    int st = mqttClient.state();
    char ststr[20];
    itoa(st,ststr,10);

    logit(0,ME,f,"mqttClient.connect failed - reset the arduino - ",ststr);
    resetFunc();
  }
  logit(0,MN,f,"Mqtt connected",NULL);
}

void sampleInputs() {
  // Loop through the inputs, read value, and post to MQTT
  const char *f = "sampleInputs";
  logit(3,MD,f,"sampleInputs enter ", NULL);
  for (int m = 0; m < inputN; m++) {
    inputS *input = &inputA[m];
    logit(2,MD,f,"sample ", input->metricId);
    float value = MV;
    switch (input->type) {
      case IN_BUTTON:
        break;
      case IN_MAX6675:
        logit(1,MD,f,"temp ", input->name);
//      value = calcAvg(m, tc.readFahrenheit());
        value = tc.readFahrenheit();
        snprintf(payload, payloadSize, "%s value=%g", input->tags, value);
        logit(1,MD,f,"payload:", payload);
        mqttClient.publish(mqttInputPub, payload);
        freeMemory();
        break;
    }
  }
}

void setup() {
  const char *f = "setup";

  startTime = millis();

  strcpy(projectId, "unknown");
  randomSeed(micros());
  mqttClientId = "arduino_" + String(random(0xffff), HEX);

  Serial.begin(115200);
  wifiInit();

  logit(2,MD,f,"Assign mqttAdmin*Pub paths",mqttAdminCmdPub);
  strcpy(mqttAdminCmdPub, "a/cmd/administrator");
  strcpy(mqttAdminRspPub, "a/rsp/administrator");

  snprintf(mqttAdminAllSub, msgSize, "a/cmd/all");        // admin commands to all
  snprintf(mqttAdminIpSub, msgSize, "a/rsp/%s",  ip);     // admin commands to ip
  snprintf(mqttAdminResponseSub, msgSize, "a/rsp/%s", ip);   // admin responses

  logit(1,MD,f,"Set MQTT server",mqttIp);
  mqttClient.setServer(mqttIp, mqttPort);
  mqttClient.setCallback(mqttCallback);

  mqttConnect();

  logit(2,MD,f,"Subscribe to admin messages ", NULL);
  snprintf(mqttAdminAllSub, msgSize, "a/cmd/all");             // all administrator commands
  res = mqttClient.subscribe(mqttAdminAllSub);
//snprintf(mqttAdminIpSub, msgSize, "a/cmd/%s", ip);           // CLIENTID administrator commands
//res = mqttClient.subscribe(mqttAdminIpSub);
  snprintf(mqttAdminResponseSub, msgSize, "a/rsp/%s", ip);     // CLIENTID administrator responses
  res = mqttClient.subscribe(mqttAdminResponseSub);

  requestConfig();
  delay(500);
}

void loop() {
  const char *f = "loop";
//logit(3,MD,f,"Start loop",NULL);

  int tries = 0;
  if (WiFi.status() != WL_CONNECTED) {
    logit(0,ME,f,"WiFi not connected - reset the arduino",NULL);
    delay(500);
    resetFunc();
  }
  while (!mqttClient.connected()) {
    connected = false;
//  delay(100);
//  mqttClient.disconnect();
    delay(250);
    mqttConnect();
//  char intstr[10];
//  int st = mqttClient.state();
//  logit(0,ME,f,"\nmqttClient.connected returned false ",itoa(st, intstr, 10));
    tries++;
    if (tries == 10) {
      logit(0,ME,f,"\nmqttClient.connected returned false 10 times - reset the arduino",NULL);
      delay(500);
      connected = false;
      resetFunc();
    }
  }

  mqttClient.loop();
  if (haveConfig && sampling) {
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