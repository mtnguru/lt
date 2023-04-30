import * as React from "react";
import { Link } from "react-router-dom";
import classes from './MainNavigation.module.scss';

function MainNavigation() {
  return (
    <header className={classes.header}>
      <div className={classes.logo}><h2>Upstream Productions</h2></div>
      <nav>
        <ul>
          <li key="upstream"><Link to='/'>Player</Link></li>
          <li key="mqtt"><Link to='/mqtt'>MQTT</Link></li>
          <li key="admin"><Link to='/admin'>Admin</Link></li>
        </ul>
      </nav>
    </header>
  )
}

export default MainNavigation;
