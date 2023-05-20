import * as React from "react";
import { Link } from "react-router-dom";
import classes from './MainNavigation.module.scss';

function MainNavigation() {
  return (
    <header className={classes.header}>
      <div className={classes.logo}><h2>LabTime</h2></div>
      <nav>
        <ul>
          <li key="expt"><Link to='/expt'>Experiment</Link></li>
          <li key="mqtt"><Link to='/mqtt'>MQTT</Link></li>
          <li key="play"><Link to='/admin'>Administration</Link></li>
        </ul>
      </nav>
    </header>
  )
}

export default MainNavigation;
