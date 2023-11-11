#include <OneWire.h>

// Define the OneWire pin
OneWire oneWire(14); // Use the appropriate digital pin here (e.g., D2)

// Replace this with the address of your DS18S20
byte dsAddress[] = {40, 192, 156, 87, 4, 225, 61, 37};

void setup() {
  Serial.begin(115200);
}

void loop() {
  byte data[12];

  Serial.print("Address: ");
  Serial.print(dsAddress[0]);
  Serial.print(" ");
  Serial.print(dsAddress[1]);
  Serial.print(" ");
  Serial.println(dsAddress[2]);
  oneWire.reset();                // Reset the OneWire bus
  oneWire.select(dsAddress);      // Select the DS18S20 using its address
  oneWire.write(0x44);            // Start temperature conversion
  delay(750);                     // Wait for conversion to complete (750ms for DS18S20)
  oneWire.reset();                // Reset and select the DS18S20 again
  oneWire.select(dsAddress);

  // Read the temperature data
  oneWire.write(0xBE);
  for (byte i = 0; i < 9; i++) {
    data[i] = oneWire.read();
  }

  // Convert the data to Celsius
  int16_t rawTemperature = (data[1] << 8) | data[0];
  float c = (float)rawTemperature / 16.0;
  float f = c * 9 / 5 + 32;

  // Print the temperature
  Serial.print("Temperature: ");
  Serial.print(c);
  Serial.print(" °C  ");

  Serial.print(f);
  Serial.println(" °F");

  delay(1000); // Wait before taking another reading
}