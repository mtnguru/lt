import * as React from "react";
import { Link } from "react-router-dom";
import classes from './MainNavigation.module.scss';

function MainNavigation() {
  return (
    <header className={classes.header}>
      <div className={classes.logo}><h2>LabTime</h2></div>
      <nav>
        <ul>
          <li key="oxy"><Link to='/oxy'>Oxy</Link></li>
          <li key="safire"><Link to='/safire'>Safire</Link></li>
          <li key="cabin"><Link to='/cabin'>Cabin</Link></li>
          <li key="mqtt"><Link to='/mqtt'>MQTT</Link></li>
        </ul>
      </nav>
    </header>
  )
}

export default MainNavigation;
