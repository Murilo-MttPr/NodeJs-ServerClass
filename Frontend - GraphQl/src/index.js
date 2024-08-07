// import React from 'react';
// import { createRoot } from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
// import App from './App';

// const container = document.getElementById('root');
// if (container) {
//   const root = createRoot(container); // Use createRoot(container!) se você estiver usando TypeScript
//   root.render(
//     <BrowserRouter>
//       <App />
//     </BrowserRouter>
//   );
// } else {
//   console.error("Não foi possível encontrar o contêiner DOM 'root'");
// }

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
} else {
  console.error("Não foi possível encontrar o contêiner DOM 'root'");
}