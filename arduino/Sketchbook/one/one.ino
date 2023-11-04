#include <OneWire.h>
#include <DallasTemperature.h>

// Data wire is connected to pin 2 on the Arduino
#define ONE_WIRE_BUS 14

// Setup a oneWire instance to communicate with any OneWire device
OneWire oneWire(ONE_WIRE_BUS);

// Pass oneWire reference to DallasTemperature library
DallasTemperature sensors(&oneWire);

void setup() {
  // Start serial communication at a baud rate of 9600:
  Serial.begin(115200);
  Serial.println("Starting");
  // Start the DS18B20 sensor
  sensors.begin();
}

void loop() {
  // Request temperature from DS18B20
  sensors.requestTemperatures();
  // Fetch and print temperature in Celsius
  float temperatureC = sensors.getTempCByIndex(0);
  Serial.print("Temperature: ");
  Serial.print(temperatureC);
  Serial.print(" °C   ");

  // You can also fetch temperature in Fahrenheit
  float temperatureF = sensors.getTempFByIndex(0);
  Serial.print(temperatureF);
  Serial.println(" °F");

  // Wait 1 second (1000 milliseconds)
  delay(1000);
}