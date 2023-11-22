#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 14
OneWire *oneWireP;
DallasTemperature *sensorsP;

void setup() {
  // Start serial communication at a baud rate of 9600:
  Serial.begin(115200);
  Serial.println("Starting");
  // Start the DS18B20 sensor
  oneWireP = new OneWire(ONE_WIRE_BUS);
  sensorsP  = new DallasTemperature(oneWireP);
  sensorsP->begin();
}

void loop() {
  // Request temperature from DS18B20
  sensorsP->requestTemperatures();
  // Fetch and print temperature in Celsius
  float temperatureC = sensorsP->getTempCByIndex(0);
  Serial.print("Temperature: ");
  Serial.print(temperatureC);
  Serial.print(" °C   ");

  // You can also fetch temperature in Fahrenheit
  float temperatureF = sensorsP->getTempFByIndex(0);
  Serial.print(temperatureF);
  Serial.println(" °F");

  // Wait 1 second (1000 milliseconds)
  delay(1000);
}