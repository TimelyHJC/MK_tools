(function(){
  var storageKeys = {
    form: "settings_form_url",
    table: "settings_table_url"
  };
  var autoSaveDelayMs = 400;
  var formInput = document.getElementById("form-url-input");
  var tableInput = document.getElementById("table-url-input");
  var flushers = [];

  if(!formInput) return;

  function normalizeValue(input){
    return input ? String(input.value || "").trim() : "";
  }

  function saveInput(key, input){
    var payload = {};
    payload[key] = normalizeValue(input);
    chrome.storage.local.set(payload);
  }

  function bindAutoSave(key, input){
    var timerId = null;

    if(!input) return null;

    function flush(){
      if(timerId !== null){
        clearTimeout(timerId);
        timerId = null;
      }
      saveInput(key, input);
    }

    function schedule(){
      if(timerId !== null) clearTimeout(timerId);
      timerId = setTimeout(function(){
        timerId = null;
        saveInput(key, input);
      }, autoSaveDelayMs);
    }

    input.addEventListener("blur", flush);
    input.addEventListener("change", flush);
    input.addEventListener("input", schedule);
    return flush;
  }

  function load(){
    chrome.storage.local.get([storageKeys.form, storageKeys.table], function(result){
      formInput.value = (result[storageKeys.form] && String(result[storageKeys.form]).trim()) || "";
      if(tableInput){
        tableInput.value = (result[storageKeys.table] && String(result[storageKeys.table]).trim()) || "";
      }
    });
  }

  function flushAll(){
    flushers.forEach(function(flush){
      flush();
    });
  }

  flushers.push(bindAutoSave(storageKeys.form, formInput));
  if(tableInput) flushers.push(bindAutoSave(storageKeys.table, tableInput));
  flushers = flushers.filter(Boolean);

  document.addEventListener("visibilitychange", function(){
    if(document.hidden) flushAll();
  });
  window.addEventListener("pagehide", flushAll);

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", load, { once: true });
  }else{
    load();
  }
})();
