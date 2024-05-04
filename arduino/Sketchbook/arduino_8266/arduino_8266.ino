/*
  *  Arduino WiFi program - arduino.ino
    - send and receive json messages with MQTT client
       - obtain configuration information from LabTime program
       - publish sensor values on change
       - subscribe to output messages and set channel output accordingly
*/

#include <math.h>
//#include <MemoryFree.h>

const char *version = "2.1";
const char *programId = "arduino.js";
int configNotReceived = 0;
int mqttConnected = 0;
int mqttNotConnected = 0;
unsigned long startTime = 0;
unsigned long lastSample = 0;
unsigned long sampleInterval = 30000;
int enabled = 1;
int debugLevel = 2;

///////////// Mqtt server credentials
//const char* mqttIp = "172.16.45.7";   // merlin
const char* mqttIp = "194.195.214.212"; // labtime.org
const char* mqttUser = "data";
const char* mqttPassword = "datawp";

const int mqttPort = 1883; // lt
//const int mqttPort = 1884; // tst

///////////// WiFi
#include <ESP8266WiFi.h>
//#include <WiFi.h>
WiFiClient wifiClient;

// ASUS at cabin
const char* wifiSsid = "Starbase";
const char* wifiPassword = "starship";

// Century link at cabin
//const char* wifiSsid = "Solvay";
//const char* wifiPassword = "taichi23";

// James Cell Phone
//const char* wifiSsid = "Verizon-SM-G930V-6ED7";
//const char* wifiPassword = "taichi23";

String wifiIP;

///////////// MAX6675 thermocouple
#include "max6675.h"

///////////// OneWire
#include <OneWire.h>
#include <DallasTemperature.h>

const int oneWirePin = 14;  // ESP32
//const int oneWirePin = 7;   // ESP8266

OneWire *oneWireP = NULL;
//DallasTemperature *sensorsP = NULL;

///////////// JSON
//#include "ArduinoJson.h"
//const int jsonDocSize = 5000;       // May 29, 2023 - crashes at 924
//StaticJsonDocument<jsonDocSize> jsonDoc;

#include "Arduino_JSON.h"
const int jsonBufferSize = 5000;
char jsonBuffer[jsonBufferSize];

const int payloadSize = 5000;       // Configuration uses 1404
const int msgSize = 1000;
char msg[msgSize];
char logMsg[msgSize];
const int tStrSize = 200;
char tStr[tStrSize];

const int outSize = 1000;
char out[outSize];

const int statusSize = 600;
char status[statusSize];

const int tagSize = 200;
const int topicSize = 100;
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

enum inputTypeE {IN_MAX6675, IN_ONEWIRE_F, IN_ONEWIRE_C, IN_BUTTON};
struct inputS {
  char metricId[metricIdSize];
  char name[metricIdSize];
  inputTypeE channelType;
  char channels[12];
  char topic[topicSize];
  char tags[tagSize];
  MAX6675 *max6675P;         // channelType == "max6675"
  byte deviceId[8];  // channelType == onewire
};

const int inputMax = 2;
const int outputMax = 2;
inputS inputA[inputMax];
outputS outputA[outputMax];
int inputN = 0;
int outputN = 0;

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
char mqttCodPub[topicSize];       // publish code debug messages
char mqttMsgPub[topicSize];       // publish messages - notifications, etc.

///////////// Array for calculating running average
const float MV = -999.999;
const int avgN = 2;
float temps[inputMax][avgN];

/////////////

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
  logit(3,MD,f,"Free memory ",freeHeap.c_str());
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
      strcpy(typeName,"Notify");
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

void(* reset) (void) = 0;    // declare reset function @ address 0

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
    "{\"rsp\": \"requestStatus\", \"clientId\": \"%s\", \"mqttClientId\":\"%s\", \"mqttConnected\": %d, \"enabled\":%d, \"debugLevel\":%d, \"sampleInterval\":%lu, \"version\":\"%s\", \"uptime\":\"%s\" }",
    clientId, mqttClientId.c_str(), mqttConnected, enabled, debugLevel, sampleInterval, (char *)version, uptime);

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

void startOneWire() {
  if (!oneWireP) {
    oneWireP = new OneWire(oneWirePin);
//  sensorsP = new DallasTemperature(oneWireP);
//  sensorsP->begin();
  }
}

void findOneWireDevices(char *devices) {
  byte address[8];

  Serial.println("Searching for OneWire devices...");
  oneWireP->reset_search();

  int nDevices = 0;
  devices[0] = '\0';
  while (oneWireP->search(address)) {
    if (OneWire::crc8(address, 7) == address[7]) {
      nDevices++;
      char deviceId[80];
      snprintf(deviceId,80,
        "\"%d,%d,%d,%d,%d,%d,%d,%d\"",
        address[0],
        address[1],
        address[2],
        address[3],
        address[4],
        address[5],
        address[6],
        address[7]
      );
      Serial.print("Device: ");
      Serial.println(deviceId);

      if (nDevices == 1) {
        strcpy(devices,"\"devices\": [");
        strcat(devices,deviceId);
      } else {
        strcat(devices,",");
        strcat(devices,deviceId);
      }
    } else {
      Serial.println("CRC is not valid!");
    }
  }
  if (nDevices > 0) {
    strcat(devices,"]");
  } else {
    strcpy(devices,"\"devices\": \"none\"");
  }

  Serial.println("Done searching for OneWire devices...");

}

float readOneWireTemp(char corf, byte *deviceId) {
  const char *f = "readOneWireTemp";
  byte data[12];

  logit(2,MD,f,"Read onewire temperature", NULL);

  oneWireP->reset();                // Reset the OneWire bus
  oneWireP->select(deviceId);       // Select the DS18S20 using its address
  oneWireP->write(0x44);            // Start temperature conversion
  delay(750);                       // Wait for conversion to complete (750ms for DS18S20)
  oneWireP->reset();                // Reset onewire bus
  oneWireP->select(deviceId);       // Select the DS18S20 again

  // Read the temperature data
  oneWireP->write(0xBE);
  for (byte i = 0; i < 9; i++) {
    data[i] = oneWireP->read();
  }

  // Convert the data to Celsius
  int16_t rawTemperature = (data[1] << 8) | data[0];
  float c = (float)rawTemperature / 16.0;

  if (corf == 'C') {
    return c;
  } else {
    return c * 9 / 5 + 32;
  }
}

void setConfig(const char *topic,
               JSONVar jsonDoc) {
  const char *f = "setConfig";
  logit(2,MD, f, "enter", topic);
  freeMem();

  logit(1,MN, f, "Date ", jsonDoc["date"]);
  strcpy(clientId, jsonDoc["clientId"]);

  sampleInterval = (unsigned long)jsonDoc["status"]["sampleInterval"];
  logit(0,MD, f, "enter", topic);
  if (sampleInterval == 0) {
    sampleInterval = 30000;
  }
  lastSample = millis() - sampleInterval + 500;

  enabled = (int)jsonDoc["status"]["enabled"];
  debugLevel = (int)jsonDoc["status"]["debugLevel"];
  haveConfig = true;   // Enables logit messages to be printed

  ///////////// Unsubscribe to initial response messages
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
  strcpy(mqttCodPub,    jsonDoc["topics"]["publish"]["cod"]);
  strcpy(mqttMsgPub,    jsonDoc["topics"]["publish"]["msg"]);

  // Loop through metrics, initialize inputA[]
  inputN = 0;
  logit(2,MD,f,"Check Inputs",NULL);
  if (jsonDoc.hasOwnProperty("inp")) {
    JSONVar metrics = jsonDoc["inp"];
    logit(2,MD,f,"Process input metrics ",NULL);
    for (int m = 0; m < metrics.length(); m++) {
      JSONVar metric = metrics[m];
      char metricId[metricIdSize];
      strcpy (metricId, metric["metricId"]);
      logit(1,MD,f,"Input ",metricId);

      strcpy(inputA[inputN].metricId, metricId);
      const char *channelType = metric["inp"]["channelType"];
      strcpy(inputA[inputN].tags, metric["inp"]["tags"]);
      logit(2,MD,f,"tags ",inputA[inputN].tags);
      strcpy(inputA[inputN].topic,  metric["inp"]["topic"]);
      logit(2,MD,f,"topic ",inputA[inputN].topic);
      if (strcmp(channelType,"button") == 0) {
        inputA[inputN].channelType  = IN_BUTTON;
      } else if (strcmp(channelType,"max6675") == 0) {     // MAX6675 K Thermocouple
        logit(1,MD,f,"Set channelType as MAX6675 ",NULL);
        inputA[inputN].channelType  = IN_MAX6675;
        int thermoDO  = (int)metric["inp"]["thermoDO"];
        int thermoCS  = (int)metric["inp"]["thermoCS"];
        int thermoCLK = (int)metric["inp"]["thermoCLK"];
        inputA[inputN].max6675P = new MAX6675(thermoCLK, thermoCS, thermoDO);
      } else if (strcmp(channelType,"onewire_c") == 0) {   // OneWire DS18B20S C
        logit(1,MD,f,"Set channelType as onewire_c ",NULL);
        inputA[inputN].channelType  = IN_ONEWIRE_C;
        JSONVar deviceId = metric["input"]["deviceId"];
        for (int i = 0; i < 8; i++) {
          inputA[inputN].deviceId[i] = (int)deviceId[i];
        }
        startOneWire();
      } else if (strcmp(channelType,"onewire_f") == 0) {   // OneWire DS18B20S F
        logit(1,MD,f,"Set channelType as onewire_f ",NULL);
        inputA[inputN].channelType  = IN_ONEWIRE_F;
        JSONVar deviceId = metric["inp"]["deviceId"];
        for (int i = 0; i < 8; i++) {
          inputA[inputN].deviceId[i] = (int)deviceId[i];
        }
        startOneWire();
      } else {
        logit(1,ME, f, "Cannot find input channelType - rebooting: ", channelType);
        delay(15000);
        reset();
      }
      logit(2,MD,f,"Input added ", metricId);
      inputN++;
    }
  }

  JSONVar rootOutput = jsonDoc["out"];
  logit(1,MD,f,"Check Outputs",NULL);
  /*
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
        delay(15000);
        reset();
      }

      logit(0,MD,f,"Output added ", metricId);
      strcpy(outputA[outputN].tags,      metric.value()["output"]["tags"]);
      strcpy(outputA[outputN].topic,      metric.value()["output"]["topic"]);
      logit(0,MD,f,"Output added ", metricId);
      strcpy(outputA[outputN].channel,   metric.value()["output"]["channel"]);
//    strcpy(outputA[outputN].metricId,  metric.value()["metricId"]);
//    strcpy(outputA[outputN].name,      metric.value()["name"]);

      pinMode(outputA[outputN].channel, OUTPUT);
      logit(0,MD,f,"Output channel ", channel);
      outputN++;
    }
  }
  */

  logit(1,MD, f, "exit", NULL);
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
    JSONVar jsonDoc = JSON.parse(payload);
    if (JSON.typeof(jsonDoc) == "undefined") {
      logit(0,ME,f,"Error parsing JSON",payload);
      return;
    }

    logit(1,MD,f,"parsed ", payload);

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
        delay(10000);
        reset();
      } else if (!strcmp(cmd, "requestStatus")) {       // Ask arduino for its status
        logit(1,MD,f,"status requested", outTopic);
        getStatus();
      } else if (!strcmp(cmd, "readInputs")) {          // Read all inputs
        logit(1,MD,f,"readInputs requested", outTopic);
        readInputs();
      } else if (!strcmp(cmd, "setDebugLevel")) {       // Set debugLevel
        debugLevel = (int)jsonDoc["debugLevel"];
        snprintf(out,msgSize,"{\"rsp\":\"%s\", \"clientId\": \"%s\", \"debugLevel\":%d}", cmd, clientId, debugLevel);
        logit(0,MN,f,"set Debug Level", outTopic);
      } else if (!strcmp(cmd, "setEnabled")) {          // Enabled arduino
        enabled = (int)jsonDoc["enabled"];
        lastSample = millis() - sampleInterval + 500;   // Force immediate read after changing
        snprintf(out,msgSize,"{\"rsp\":\"%s\", \"clientId\": \"%s\", \"enabled\":%d}", cmd, clientId, enabled);
      } else if (!strcmp(cmd, "setSampleInterval")) {   // Set sample interval
        sampleInterval = (unsigned long)jsonDoc["sampleInterval"];
        snprintf(out,msgSize,"{\"rsp\":\"%s\", \"clientId\": \"%s\", \"sampleInterval\":%ld}", cmd, clientId, sampleInterval);
      } else if (!strcmp(cmd, "findOneWireDevices")) {  // Find one wire devices
        char devices[500];
        findOneWireDevices(devices);
        snprintf(out,outSize,"{\"rsp\":\"%s\", \"clientId\": \"%s\", %s}", cmd, clientId, devices);
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
  int attempts = 0;

  delay(100);

  connected = false;
  while (!mqttClient.connected()) {
    if (mqttClient.connect(mqttClientId.c_str(), mqttUser, mqttPassword)) {
      mqttConnected++;
      logit(0,MN, f, "Mqtt connected", NULL);
    } else {
      int st = mqttClient.state();
      char ststr[20];
      itoa(st,ststr,10);
      logit(0,ME,f,"mqttClient.connected returned false   state: ",ststr);
      delay(1000);

      attempts++;
      if (attempts == 10) {
        logit(0,ME,f,"mqttClient.connected returned false 10 times - reset the arduino",NULL);
        delay(500);
        reset();
      }
    }
  }
  connected = true;
}

void readInputs() {
  // Loop through the inp, read value, and post to MQTT
  const char *f = "readInputs";
  logit(3,MD,f,"readInputs enter ", NULL);
  for (int m = 0; m < inputN; m++) {
    inputS *input = &inputA[m];
    logit(2,MD,f,"sample ", input->metricId);
    float value = MV;
    switch (input->channelType) {
      case IN_BUTTON:
        break;
      case IN_MAX6675:
        logit(1,MD,f,"check temperature", NULL);
        value = input->max6675P->readFahrenheit();
        if (value > 500) {
          snprintf(out, outSize, "temperature out of range: %f", value);
          logit(0,ME,f,out, NULL);
        } else {
          snprintf(out, outSize, "value=%g", value);
          logit(1,MD,f,"temperature acquired", out);

          snprintf(out, outSize, "%s value=%g", input->tags, value);
          mqttClient.publish(input->topic, out);
        }
        break;
      case IN_ONEWIRE_F:
        value = readOneWireTemp('F', input->deviceId);
        snprintf(out, outSize, "%s value=%g", input->tags, value);
        mqttClient.publish(input->topic, out);
        break;
      case IN_ONEWIRE_C:
        value = readOneWireTemp('C', input->deviceId);
        snprintf(out, outSize, "%s value=%g", input->tags, value);
        mqttClient.publish(input->topic, out);
        break;
    }
  }
  freeMem();
}

void setup() {
  const char *f = "setup";
  Serial.begin(115200);
  startTime = millis();
  Serial.println((String)"starting program");

  strcpy(projectId, "unknown");
  randomSeed(micros());
  mqttClientId = "arduino_" + String(random(0xffff), HEX);

  wifiInit();

  logit(1,MD,f,"Init MQTT server",mqttIp);
  mqttClient.setServer(mqttIp, mqttPort);
  mqttClient.setKeepAlive(15);
//mqttClient.setCleanSession(false);
//mqttClient.setReconnectPeriod(5000);
  mqttClient.setBufferSize(payloadSize);
  mqttClient.setCallback(mqttCB);
  mqttClient.setSocketTimeout(5000);

  Serial.println((String)"setup - call mqttConnect");
  mqttConnect();

  mqttClient.loop();

  strcpy(mqttCmdPub, "a/cmd/administrator");

  logit(2,MD,f,"Subscribe to admin response messages ", NULL);
  snprintf(mqttRspSub, topicSize, "a/rsp/%s", ip);   // admin responses
  res = mqttClient.subscribe(mqttRspSub);

  requestConfig();
  delay(500);
}

void loop() {
  const char *f = "loop";
  logit(3,MD,f,"Start loop",NULL);

  if (WiFi.status() != WL_CONNECTED) {
    logit(0,ME,f,"WiFi not connected - reset the arduino",NULL);
    delay(10000);
    reset();
  }

  if (!(mqttClient.connected())) {
    logit(1,MD,f,"mqtt not connected()",NULL);

    Serial.println((String)"loop - call mqttConnect");
    mqttConnect();
    subscribeTopics();
  }

  mqttClient.loop();

  if (connected) {
    if (haveConfig) {
      if (enabled) {
        unsigned long now = millis();
        if (now - lastSample > sampleInterval) {
          logit(2,MD,f,"do Sample start",NULL);
          lastSample = now;
          readInputs();
          logit(2,MD,f,"do Sample done",NULL);
        }
      } else {  // not enabled
        logit(1,MD,f,"arduino not enabled",NULL);
        delay(3000);
      }
    } else {    // config not received
      snprintf(tStr, tStrSize, "Config not received: %d", configNotReceived);
      logit(0,MD, f, tStr, NULL);
      configNotReceived++;
      delay(1000);
      if (configNotReceived > 20) {
        logit(0,MD, f,"Too many attempts waiting for config, rebooting arduino", NULL);
        delay(500);
        reset();
      }
    }
  } else {     // not connected to MQTT
    mqttNotConnected++;
    logit(1,MD,f,"arduino not connected",NULL);
    delay(3000);
    if (configNotReceived > 10) {
      logit(0,MD, f,"Too many attempts connecting, rebooting arduino", NULL);
      delay(500);
      reset();
    }
  }
}