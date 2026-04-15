(function(){
  var formKey='settings_form_url', tableKey='settings_table_url';
  var formInput=document.getElementById('form-url-input'),
      tableInput=document.getElementById('table-url-input');
  if(!formInput)return;
  function load(){
    chrome.storage.local.get([formKey,tableKey],function(r){
      formInput.value=(r[formKey]&&String(r[formKey]).trim())||'';
      tableInput&&(tableInput.value=(r[tableKey]&&String(r[tableKey]).trim())||'');
    });
  }
  function saveForm(){var v=(formInput.value||'').trim();chrome.storage.local.set({settings_form_url:v});}
  function saveTable(){var v=tableInput?(tableInput.value||'').trim():'';chrome.storage.local.set({settings_table_url:v});}
  formInput.addEventListener('blur',saveForm);
  formInput.addEventListener('change',saveForm);
  formInput.addEventListener('input',function(){clearTimeout(formInput._saveT);formInput._saveT=setTimeout(saveForm,400);});
  if(tableInput){tableInput.addEventListener('blur',saveTable);tableInput.addEventListener('change',saveTable);tableInput.addEventListener('input',function(){clearTimeout(tableInput._saveT);tableInput._saveT=setTimeout(saveTable,400);});}
  document.addEventListener('visibilitychange',function(){if(document.hidden){saveForm();saveTable();}});
  window.addEventListener('pagehide',function(){saveForm();saveTable();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})();
