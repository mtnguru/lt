// File: LineChartPanel.js
import React, {useCallback, useState, useEffect} from 'react';

import {
//Text,
  Container,
//Flex,
} from '@chakra-ui/react'

import {mqttRegisterMetricCB, mqttPublish} from '../../utils/mqttReact'
import {c2f, findMetric} from '../../utils/metrics'

import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

//import { Doughnut } from "react-chartjs-2";
import { Line } from 'react-chartjs-2';

import 'chartjs-adapter-moment';
import 'chartjs-plugin-streaming';

import './LineChartPanel.scss'

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChartPanel = (props) => {
  const [metrics, setMetrics] = useState({})
  var { projectId, metricIds, actionId } = props
  projectId = projectId.toLowerCase()

  useEffect(() => {
    var metrics = {}
    for (var metricId of metricIds)  {
      metrics[metricId] = findMetric(projectId, metricId)
    }
    setMetrics(metrics)
  }, [metricIds])

  const metricCB = useCallback((metric, topic, payload, tags, values) => {
    /*
//    const f = "LineChartPanel::metricCB"
//    console.log(f,"enter ", topic)
    if (actionId !== tags.ActionId) return
    setVal((prevValue) => {
      let val = values.value
//    data[projectId][metricId][actionId]
      if (metric.convert === 'c2f') {
        val = c2f(val)
      }
      return parseFloat(val).toFixed(metric.decimals);
    })
    if (props.metricCB) {
      props.metricCB(metric, topic, payload, tags, values)
    }
    */
  }, [props, actionId])

  useEffect(() => {
//  mqttRegisterMetricCB(projectId,metricId, metricCB)
  }, [metricCB])

  const date=Date.now();

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    plugins: {
//    title: {
//      display: true,
//      text: 'Chart.js Line Chart - Multi Axis',
//    },
    },
    scales: {
      x: {
        type: "time",
        display: true,
        time: {
          unit: "hour",
          tooltipFormat: "HH:MM",
        },
//      min: date - 432000000,
//      max: date,
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
//      min: 50,
//      max: 80,
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
//      grid: {
//        drawOnChartArea: true,
//      },
      },
    },
  };

  const values = [
    {
      x: date - 90000000,
      y: 66,
    },
    {
      x: date - 80000000,
      y: 69,
    },
    {
      x: date - 70000000,
      y: 68,
    },
    {
      x: date - 60000000,
      y: 68,
    },
    {
      x: date - 50000000,
      y: 69,
    },
    {
      x: date - 40000000,
      y: 70,
    },
    {
      x: date - 30000000,
      y: 72,
    },
    {
      x: date - 20000000,
      y: 71,
    },
  ]
  const data = {
    datasets: [
      {
        label: 'Dataset 1',
        data: values,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Dataset 2',
        data: values,
        borderColor: 'rgb(0, 155, 59)',
        backgroundColor: 'rgba(0, 155, 59, 0.5)',
        yAxisID: 'y1',
      },
    ],
  };

  return (
    <Container className="line-chart" mb={1} >
      <Line options={options} data={data} />
      <div>value: {val}</div>
    </Container>
  )
}

export default LineChartPanel
