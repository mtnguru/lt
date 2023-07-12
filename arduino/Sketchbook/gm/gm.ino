#include <Wire.h>
#include <SPI.h>
#include <Ethernet2.h>
#include <SD.h>
#include <RTClib.h>

RTC_DS1307 RTC;


byte mac[] = { 0xA8, 0x61, 0x0A, 0xAE, 0x86, 0x82 };
byte ip[] = { 192, 168, 137, 200 };
byte gateway[] = { 192, 168, 137, 1 };
byte subnet[] = { 255, 255, 255, 0 };
EthernetServer server(80);

#define PAYLOAD_SIZE 6
#define NODE_MAX 13
#define START_NODE 2
#define NODE_READ_DELAY 50

const int chipSelect = 4;

int nodePayload[PAYLOAD_SIZE];
String stringOne = ",";
String stringTwo = "\t";

void setup() {
  Serial.begin(115200);
  Ethernet.begin(mac, ip, gateway, subnet);
  server.begin();
  Wire.begin();

  // Time
  RTC.begin();
  RTC.adjust(DateTime(__DATE__, __TIME__));

  // SD and File Start
  SD.begin(chipSelect);
  File dataFile = SD.open("datalog.csv", FILE_WRITE);
  dataFile.println("DATE, TIME, N0201, N0202, N0203, N0204, N0205, N0206, N0301, N0302, N0303, N0304, N0305, N0306, N0401, N0402, N0403, N0404, N0405, N0406, N0501, N0502, N0503, N0504, N0505, N0506, N0601, N0602, N0603, N0604, N0605, N0606, N0701, N0702, N0703, N0704, N0705, N0706, N0801, N0802, N0803, N0804, N0805, N0806, N0901, N0902, N0903, N0904, N0905, N0906, N1001, N1002, N1003, N1004, N1005, N1006, N1101, N1102, N1103, N1104, N1105, N1106, N1201, N1202, N1203, N1204, N1205, N1206, N1301, N1302, N1303, N1304, N1305, N1306");
  dataFile.close();
}

void loop() {
  DateTime now = RTC.now();
  File dataFile = SD.open("datalog.csv", FILE_WRITE);
  EthernetClient client = server.available();
  if (client) {
    boolean currentLineIsBlank = true;
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        Serial.write(c);
        if (dataFile) {
          if (c == '\n' && currentLineIsBlank) {
            client.println("HTTP/1.1 200 OK");
            client.println("Connection: close");
            client.println("Refresh: 1");
            client.println();
            client.print("Date:");
            client.print(now.day(), DEC);
            client.print('.');
            client.print(now.month(), DEC);
            client.print('.');
            client.print(now.year(), DEC);
            client.print('\t');
            client.print("Time:");
            client.print(now.hour(), DEC);
            client.print(':');
            client.print(now.minute(), DEC);
            client.print(':');
            client.print(now.second(), DEC);
            client.print("\n");
            dataFile.print(now.day(), DEC);
            dataFile.print('.');
            dataFile.print(now.month(), DEC);
            dataFile.print('.');
            dataFile.print(now.year(), DEC);
            dataFile.print(stringOne);
            dataFile.print(now.hour(), DEC);
            dataFile.print(':');
            dataFile.print(now.minute(), DEC);
            dataFile.print(':');
            dataFile.print(now.second(), DEC);
            dataFile.print(stringOne);
            for (int nodeAddress = START_NODE; nodeAddress <= NODE_MAX; nodeAddress++) {
              Wire.requestFrom(nodeAddress, PAYLOAD_SIZE);
              if (Wire.available() == PAYLOAD_SIZE) {
                  client.print("Node ");
                  client.print(nodeAddress);
                  client.print(" -");
                  client.print('\t');
                  for (int i = 0; i < PAYLOAD_SIZE; i++) nodePayload[i] = Wire.read();
                  for (int j = 0; j < PAYLOAD_SIZE; j++) {
                  client.print(nodePayload[j] + stringTwo);
                  dataFile.print(nodePayload[j] + stringOne);
                }
              }
              client.print("\n");
            }
            dataFile.print("\n");
            break;
          }
        }
      }
    }
    delay(NODE_READ_DELAY);
  }
  dataFile.close();
  client.stop();
}

void printDirectory(File dir, Stream &stream) {
  while (true) {
    File entry = dir.openNextFile();
    if (!entry) {
      // no more files
      break;
    }

    stream.print(entry.name());
    if (entry.isDirectory()) {
      stream.println("/");
    } else {
      // files have sizes, directories do not
      stream.print(" [");
      stream.print(entry.size(), DEC);
      stream.println("]");
    }
    entry.close();
  }
}