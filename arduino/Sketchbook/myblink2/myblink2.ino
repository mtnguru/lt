/*
  Blink

  Turns an LED on for one second, then off for one second, repeatedly.

  Most Arduinos have an on-board LED you can control. On the UNO, MEGA and ZERO
  it is attached to digital pin 13, on MKR1000 on pin 6. LED_BUILTIN is set to
  the correct LED pin independent of which board is used.
  If you want to know what pin the on-board LED is connected to on your Arduino
  model, check the Technical Specs of your board at:
  https://www.arduino.cc/en/Mroduc
  modified 8 May 2014
  by Scott Fitzgerald
  modified 2 Sep 2016
  by Arturo Guadalupi
  modified 8 Sep 2016
  by Colby Newman

  This example code is in the public domain.

  http://www.arduino.cc/en/Tutorial/Blink
*/

float fac = 5.0/1023.0;
int rin = 0;
float vin = 0;
float out = 0;

const int LED_BUILTIN = 2;

// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  delay(150);
  Serial.println((String)"");
  Serial.println((String)"howdy doody " + LED_BUILTIN);
  Serial.println((String)"howdy doody " + LED_BUILTIN);
}

// the loop function runs over and over again forever
void loop() {
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(500 );                       // wait for a second
  digitalWrite(LED_BUILTIN, 0);    // turn the LED off by making the voltage LOW
  delay(1000);                       // wait for a second

  vin = analogRead(A0) * fac;
  Serial.println((String)"vin " + vin + "   out " + out);
  out = out + .1;
}