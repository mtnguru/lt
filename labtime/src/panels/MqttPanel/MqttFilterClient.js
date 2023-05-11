import React, {useEffect, useState} from 'react'

import { Container,
         Heading,
         IconButton } from '@chakra-ui/react'
import { SettingsIcon } from '@chakra-ui/icons'

import "./MqttFilterClient.scss";
import MqttClientList from "./MqttClientList";

const lsKey = "cnFilterClient"

function MqttFilterClient(props) {

  const [allSelected, setAllSelected] = useState(false)
  const [settingsBtn, setSettingsBtn] = useState(false)

  useEffect(() => {
    const f = "MqttFilterClient::useEffect"
    let lsstr = localStorage.getItem(lsKey);
    console.log(f, lsstr)
    let ls;
    if (lsstr) {
      ls = JSON.parse(lsstr)
      for (let clientId in global.aaa.clients) {
        global.aaa.clients[clientId].selected = (ls[clientId]) ? ls[clientId].selected : true
      }
    } else {
      ls = {};
      for (let clientId in global.aaa.clients) {
        console.log(f, 'initialize localStorage ', clientId)
        if (!ls[clientId]) ls[clientId] = {}
        ls[clientId].selected = true
        global.aaa.clients[clientId].selected = true
      }
      localStorage.setItem(lsKey, JSON.stringify(ls))
    }
    setAllSelected(global.aaa.clients.all.selected)
    console.log(f,'exit', ls)
  }, [])

  const onChangeH = event => {
    console.log('MqttFilterClient::onChangeH',event.target.checked)
    global.aaa.clients[event.target.id]['selected'] = event.target.checked

    if (event.target.id === 'all') {
      setAllSelected(event.target.checked)
    }
    let ls = JSON.parse(localStorage.getItem(lsKey))
    if (!ls[event.target.id]) {
      ls[event.target.id] = {}
    }
    ls[event.target.id]['selected'] = event.target.checked
    localStorage.setItem(lsKey, JSON.stringify(ls))

    props.onChangeH(event);
  }

  const onClickH = event => {
    setSettingsBtn(!settingsBtn)
  }


  return (
    <Container className={`mqtt-filter-client ${(settingsBtn) ? "showSettings" : '' }`}>
      <Container>
        <IconButton className="settings" onClick={onClickH} aria-label='Display MqttClient Actions' icon={<SettingsIcon />}></IconButton>
        <Heading as="h3">MqttClient</Heading>
      </Container>
      <Container className={`clients mqtt-client-bg ${allSelected ? "all-selected" : ""}`}>
        <MqttClientList list={global.aaa.clients} onChangeH={onChangeH} />
      </Container>
    </Container>
  );
}

export default MqttFilterClient
