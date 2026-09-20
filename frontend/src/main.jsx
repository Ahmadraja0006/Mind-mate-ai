import React from 'react';
import { createRoot } from 'react-dom/client';
import MindMateAI from './MindMateAI.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><MindMateAI /></React.StrictMode>);

if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(()=>{}));
