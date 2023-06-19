let timeout;
self.addEventListener('message', (event) => {
  if(event.data.action === 'start_timeout'){
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      self.postMessage({ action: 'timeout' });
    }, event.data.timeout);
  } else if(event.data.action === 'clear_timeout'){
    clearTimeout(timeout);
  }
}, false);