const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('emdrify', {
  appName: 'EMDRify'
});