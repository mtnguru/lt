// File: LineChart.js
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

import './LineChart.scss'

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const date=Date.now();

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

const LineChart = (props) => {
  var { projectId, metricIds, sourceId } = props
//projectId = projectId.toLowerCase()

  const [metrics, setMetrics] = useState({})
  const [options, setOptions] = useState({})
  const [data, setData] = useState({})

  const metricCB = useCallback((metric, topic, payload, tags, values) => {
    /*
//    const f = "LineChart::metricCB"
//    console.log(f,"enter ", topic)
    if (sourceId !== tags.SourceId) return
    setVal((prevValue) => {
      let val = values.value
//    data[projectId][metricId][sourceId]
      if (metric.convert === 'c2f') {
        val = c2f(val)
      }
      return parseFloat(val).toFixed(metric.decimals);
    })
    if (props.metricCB) {
      props.metricCB(metric, topic, payload, tags, values)
    }
    */
  }, [props, sourceId])

  useEffect(() => {
    // Get options from configuration
    setOptions(global.aaa.page.panels.LineChart)

    // Get metrics, set datasets, register metricCB
    var data = {
      datasets: [],
    }
    var metrics = {}
    for (var metricId of metricIds)  {
      var metric = findMetric(metricId)
      metrics[metricId] = metric

      mqttRegisterMetricCB(metricId, metricCB)
      data.datasets.push({
        label: metric.label,
        data: values,
        borderColor: metric.color,
        backgroundColor: metric.color,
        yAxisID: 'y',
      })
    }
    setMetrics(metrics)
    setData(data)
  }, [metricIds, metricCB])


  return (
    <Container className="line-chart" mb={1} >
      {Object.keys(options).length ? (
        <Line options={options} data={data} />
      ) :
        <p className="loading">Haven't set options yet......</p>
      }
    </Container>
  )
}

export default LineChart