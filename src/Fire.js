import React from 'react';
import './fire.css';

function Fire(props) {
  return (
    <div style={props.style} class="fire-wrapper">
      <div class="flame red"></div>
      <div class="flame orange"></div>
      <div class="flame gold"></div>
      <div class="flame white"></div>
    </div>
  );
}

export default Fire;
