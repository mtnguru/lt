import React, { useEffect, useState } from 'react'
import "./MqttFilterFunc.scss";
import CheckboxList from "../../components/ui/CheckboxList";

const lsKey = "ltFilterFunc"

function MqttFilterFunc(props) {

  const [allSelected, setAllSelected] = useState(false)

  useEffect(() => {
    const f = "MqttFilterFunc::useEffect"
    let lsstr = localStorage.getItem(lsKey);
    console.log(f, lsstr)
    let ls;
    if (lsstr) { // if local storage already exists
      ls = JSON.parse(lsstr)
      for (let type in global.aaa.funcIds) {  // copy selected values into global records
        const selected = (ls[type]) ? ls[type].selected : true;
        global.aaa.funcIds[type].selected = selected
      }
    } else {
      ls = {};
      for (let type in global.aaa.funcIds) {
        console.log(f,'initialize localStorage ', type)
        if (!ls[type]) ls[type] = {}
        ls[type].selected = true
        global.aaa.funcIds[type].selected = true
      }
      localStorage.setItem(lsKey, JSON.stringify(ls))
    }
    setAllSelected(global.aaa.funcIds.all.selected)
    console.log(f,'exit', ls)
  }, [])

  const onChangeH = event => {
    console.log('MqttFilterFunc::onChangeH',event.target.checked)
    global.aaa.funcIds[event.target.id]['selected'] = event.target.checked

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

  return (
    <div className="mqtt-filter-type">
      <h3>Msg Type</h3>
      <div className={`select mqtt-type-bg ${allSelected ? "all-selected" : ""}`}>
        <CheckboxList list={global.aaa.funcIds} onChangeH={onChangeH} />
      </div>
    </div>
  );
}

export default MqttFilterFunc
