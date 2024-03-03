// File: BarChart.js
import React, {useCallback, useState, useEffect} from 'react';


import {
//Text,
  Container,
//Flex,
} from '@chakra-ui/react'

import {mqttRegisterMetricCB, mqttPublish} from '../../utils/mqttReact'
import {c2f} from '../../utils/metrics'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

//import { Doughnut } from "react-chartjs-2";
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


//import './BarChart.scss'

const BarChart = (props) => {
  var { projectId, metricId, actionId } = props
  metricId = metricId.toLowerCase()
  projectId = projectId.toLowerCase()
  const metric = global.aaa.metrics[metricId]
  const v = metric?.v?.[actionId]?.["value"]?.val
  const [val, setVal] = useState(v);

  const metricCB = useCallback((metric, topic, payload, tags, values) => {
//    const f = "BarChart::metricCB"
//    console.log(f,"enter ", topic)
    if (actionId !== tags.ActionId) return
    setVal((prevValue) => {
      let val = values.value
      if (metric.convert === 'c2f') {
        val = c2f(val)
      }
      return parseFloat(val).toFixed(metric.decimals);
    })
    if (props.metricCB) {
      props.metricCB(metric, topic, payload, tags, values)
    }
  }, [props, actionId])

  /*
  const onClickH = (event) => {
    // request metrics from admin
    var payload = {
      "cmd": "getMetric",
      "projectId": projectId,
      "metricId": metricId,
      "clientId": global.aaa.clientId,
    }
    var pjson = JSON.stringify(payload)
    const topic = "a/cmd/administrator"
    mqttPublish(topic,pjson)
    // a/req/administrator a metric id
  }
   */

  useEffect(() => {
//  setMetric(findMetric(metricId))
    mqttRegisterMetricCB(metricId, metricCB)
  }, [metricId, metricCB])

  const options = {
    responsive: true,
    plugins: {
      legend: {
//      position: 'top' as const,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Chart.js Bar Chart',
      },
    },
  };

  const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Dataset 1',
        data: [100,250,122,300,352,466,500],
        backgroundColor: 'rgba(255, 99, 132, 1)',
      },
      {
        label: 'Dataset 2',
        data: [122,300,352,466,500,122,600 ],
        backgroundColor: 'rgba(53, 162, 235, 1)',
      },
    ],
  };

  return (
    <Container mb={1} >
      <Bar options={options} data={data} />
      <div>value: {val}</div>
    </Container>
  )
}

export default BarChart
