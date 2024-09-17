import React, { useEffect } from 'react';
import { client } from '../../pocketbase.js';
import './App.css';

function App() {
  useEffect(()=> {
    client.collection("users").getFullList().then(res=> console.log(res));
  })
  return (
    <div className="App">
      <header className="App-header">
        <p>Hello!</p>
      </header>
    </div>
  );
}

export default App;
