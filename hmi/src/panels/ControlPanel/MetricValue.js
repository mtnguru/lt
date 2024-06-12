// File: MetricValue.js
import React, {useState, useEffect} from 'react';
//import useMousePosition from '../../hooks/useMousePosition';
import {mqttRegisterMetricCB} from '../../utils/mqttReact'
import {c2f} from '../../utils/metrics'
import MetricPopup from "./MetricPopup";

import './MetricValue.scss'

const MetricValue = (props) => {
  const [value, setValue] = useState(0);
  const {cmetric} = props
  const metric = cmetric.metric

  useEffect(() => {
    const metricCB = (metric, actionId, topic, payload, tags, values) => {
//    const f = "MetricValue::metricCB"
//    console.log(f,"enter ", topic)
      if (!(tags.ActionId in cmetric.metric)) return
      if (tags.ActionId !== cmetric.actionId) return
      setValue((prevValue) => {
        let val = values.value;
        if (metric.convert === 'c2f') {
          val = c2f(val)
        }
        return parseFloat(val).toFixed(metric.decimals);
      })
//    if (props.metricCB) {
//      props.metricCB(metric, topic, payload, tags, values)
//    }
    }

    mqttRegisterMetricCB(cmetric.projectId, cmetric.actionId, cmetric.metricId, metricCB)

    var v = metric?.v?.[cmetric.actionId]?.["value"]?.val
    v = parseFloat(v).toFixed(metric.decimals);
    setValue(v)
  }, [])

//const [ref, mousePosition] = useMousePosition();

//useEffect(() => {
//  // do something with the mouse position values here
//  console.log(mousePosition);
//}, [mousePosition]);

  let initialX;
  let initialY;
  let currentX;
  let currentY;
  let xOffset = 0;
  let yOffset = 0;
  let active;
  let dragItem;

  function onDragStart(e) {
    const f = 'MetricValue::onDragStart'
    console.log(f,'drag start')
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === dragItem) {
      active = true;
    }
  }

  function onDragEnd(e) {
    const f = 'MetricValue::onDragEnd'
    console.log(f,'drag end')
    initialX = currentX;
    initialY = currentY;

    active = false;
  }

  const onDrag = (e) => {
    const f = 'MetricValue::onDrag'
    console.log(f,'dragging')
    if (active) {

      e.preventDefault();

      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, dragItem);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
  }

  const content = () => {
    return (
      <div className="content">
        <div className="name">{`MetricId: ${metric.name}`}</div>
        <div className="desc">{`Description: ${metric.desc}`}</div>
        <div className="clientId">{`ClientId: ${metric[cmetric.actionId].clientId}`}</div>
        <div className="action">{`Action: ${cmetric.actionId}`}</div>
        <div className="channel">{`Channel: ${metric[cmetric.actionId].channelType}`}</div>
      </div>
    )
  }

  return (
    <div className="metric-value"
         title={metric.label}
         onMouseMove={onDrag}
         onMouseDown={onDragStart}
         onMouseUp={onDragEnd}
         style={{top: cmetric.position[0] + '%',
                 left:cmetric.position[1] + '%',
                 backgroundColor:metric.color}}
    >
      <MetricPopup title={metric.label || metric.name} content={content()} trigger={value}/>
    </div>
  )
}

export default MetricValue
