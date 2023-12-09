#include <Wire.h>
#define NODE_ADDRESS 13
#define PAYLOAD_SIZE 6

byte nodePayload[PAYLOAD_SIZE];

String stringOne = ",";

void setup(){
  Serial.begin(115200);
  Wire.begin(NODE_ADDRESS);  // Activate I2C network
  Wire.onRequest(requestEvent); // Request attention of master node
}

void loop(){ 
  nodePayload[0] = analogRead(A0); // Fit into 1 byte
  nodePayload[1] = analogRead(A1);
  nodePayload[2] = analogRead(A2);
  nodePayload[3] = analogRead(A3);
  nodePayload[4] = analogRead(A6);
  nodePayload[5] = analogRead(A7);
  for (int j = 0; j < PAYLOAD_SIZE; j++)
    Serial.print(nodePayload[j] + stringOne); // print nodes data   
  Serial.print("\n");
}

void requestEvent(){
  Wire.write(nodePayload,PAYLOAD_SIZE);  
}
