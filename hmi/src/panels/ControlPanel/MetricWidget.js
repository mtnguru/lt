// File: MetricWidget.js
import React, {useEffect} from 'react';
//import useMousePosition from '../../hooks/useMousePosition';
import {mqttRegisterMetricCB} from '../../utils/mqttReact'
//import {c2f} from '../../utils/metrics'

import MetricSlider from './MetricSlider'
import MetricFull from './MetricFull'
import MetricNumber from './MetricNumber'

import './MetricWidget.scss'

const MetricWidget = (props) => {
  const {cmetric} = props
//const [value, setValue] = useState(0);

  useEffect(() => {
    const metricCB = (metric, actionId, topic, payload, tags, values) => {
//    const f = "MetricWidget::metricCB"
//    console.log(f,"enter ", topic)
      /*
      setValue((prevValue) => {
        let val = values.value;
        if (metric.convert === 'c2f') {
          val = c2f(val)
        }
        return parseFloat(val).toFixed(metric.decimals);
      })
      */
//    if (props.metricCB) {
//      props.metricCB(metric, actionId, topic, payload, tags, values)
//    }
    }

    mqttRegisterMetricCB(cmetric.projectId, cmetric.actionId, cmetric.metricId, metricCB)
  }, [cmetric.actionId, cmetric.metricId, cmetric.projectId])

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
    const f = 'MetricWidget::onDragStart'
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
    const f = 'MetricWidget::onDragEnd'
    console.log(f,'drag end')
    initialX = currentX;
    initialY = currentY;

    active = false;
  }

  const onDrag = (e) => {
    const f = 'MetricWidget::onDrag'
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

  return (
    <div className="metric-widget mqtt-action-bg clearfix"
         onMouseMove={onDrag}
         onMouseDown={onDragStart}
         onMouseUp={onDragEnd}
         style={{ /* top: metric.position[0] + '%',
                     left:metric.position[1] + '%',
                  backgroundColor:metric.color */ }}
    >
      {/* { cmetric.title && <div className={`title ${cmetric.actionId}`}>{metric.title}</div> } */}
      { cmetric.component === 'MetricLabel'  && <div>MetricLabel</div> }
      { cmetric.component === 'MetricNumber' && <MetricNumber cmetric={cmetric}></MetricNumber> }
      { cmetric.component === 'MetricSlider' && <MetricSlider cmetric={cmetric}></MetricSlider> }
      { cmetric.component === 'MetricFull'   && <MetricFull cmetric={cmetric}></MetricFull> }
    </div>
  )
}

export default MetricWidget
