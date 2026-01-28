const $=(id)=>document.getElementById(id);
let client=null;let isConnected=false;
function nowStr(){return new Date().toLocaleString();}
function log(line){const el=$("log");el.textContent+=`[${nowStr()}] ${line}\n`;el.scrollTop=el.scrollHeight;}
function getCfg(){
  const cfg={
    host:$("inHost").value.trim(),
    port:parseInt($("inPort").value.trim()||"8084",10),
    username:$("inUser").value.trim(),
    password:$("inPass").value,
    clientId:$("inClientId").value.trim()||("web-"+Math.random().toString(16).slice(2)),
    prefix:$("inPrefix").value.trim()||"tek/",
  };
  if(cfg.prefix.length&&!cfg.prefix.endsWith("/")) cfg.prefix+="/";
  return cfg;
}
function setButtonsEnabled(on){
  $("btnDisconnect").disabled=!on; $("btnConnect").disabled=on;
  $("btnAck").disabled=!on; $("btnMute").disabled=!on; $("btnReset").disabled=!on;
  $("btnMaintOn").disabled=!on; $("btnMaintOff").disabled=!on;
}
function setPill(ok){
  const pill=$("pillStatus"); pill.classList.remove("good","bad");
  if(ok){pill.classList.add("good"); pill.textContent="BAĞLI";}
  else{pill.classList.add("bad"); pill.textContent="BAĞLI DEĞİL";}
}
function topicsFromCfg(cfg){
  const tStatus=`${cfg.prefix}status`; const tCmd=`${cfg.prefix}cmd`;
  $("topicStatus").textContent=tStatus; $("topicCmd").textContent=tCmd;
  return {tStatus,tCmd};
}
function safeJsonParse(str){try{return JSON.parse(str);}catch(e){return null;}}
function updateStatusUI(obj){
  $("stUpdated").textContent=nowStr();
  $("stDevice").textContent=String(obj.device??obj.dev??obj.id??"-");
  $("stMode").textContent=String(obj.mode??obj.sysMode??"-");
  $("stAlarm").textContent=String(obj.alarm??obj.alarmLatched??"-");
  $("stAck").textContent=String(obj.ack??obj.alarmAck??"-");
  $("stMute").textContent=String(obj.mute??obj.muteBuzzer??"-");
  $("stMaint").textContent=String(obj.maint??obj.maintenanceMode??"-");
  $("stZone").textContent=String(obj.zone??obj.zoneMask??"-");
}
function connect(){
  const cfg=getCfg();
  if(!cfg.host){alert("Broker Host boş olamaz!"); return;}
  const {tStatus,tCmd}=topicsFromCfg(cfg);
  const url=`wss://${cfg.host}:${cfg.port}/mqtt`;
  log(`Bağlanıyor: ${url} (clientId=${cfg.clientId})`);
  client=mqtt.connect(url,{
    username:cfg.username,password:cfg.password,clientId:cfg.clientId,
    keepalive:30,reconnectPeriod:2000,connectTimeout:8000,clean:true,
  });
  client.on("connect",()=>{
    isConnected=true; setPill(true); setButtonsEnabled(true); log("MQTT connected.");
    client.subscribe(tStatus,{qos:0},(err)=>{log(err?("Subscribe hata: "+err.message):("Subscribe OK: "+tStatus));});
  });
  client.on("reconnect",()=>{setPill(false); log("MQTT reconnecting...");});
  client.on("close",()=>{isConnected=false; setPill(false); setButtonsEnabled(false); log("MQTT connection closed.");});
  client.on("error",(err)=>{setPill(false); log("MQTT error: "+err.message);});
  client.on("message",(topic,payload)=>{
    const text=payload.toString();
    $("rawBox").textContent=text;
    const obj=safeJsonParse(text); if(obj) updateStatusUI(obj);
    log(`RX ${topic}: ${text.length>140?text.slice(0,140)+"...":text}`);
  });
  window.__sendCmd=(cmdObj)=>{
    if(!client||!isConnected){log("Komut gönderilemedi: bağlı değil."); return;}
    const msg=JSON.stringify(cmdObj);
    client.publish(tCmd,msg,{qos:0,retain:false});
    log(`TX ${tCmd}: ${msg}`);
  };
}
function disconnect(){
  if(client){log("Disconnect requested."); client.end(true); client=null;}
  isConnected=false; setPill(false); setButtonsEnabled(false);
}
function loadFromStorage(){
  const raw=localStorage.getItem("emqx_ui_cfg"); if(!raw) return;
  try{
    const cfg=JSON.parse(raw);
    $("inHost").value=cfg.host||""; $("inPort").value=cfg.port||"8084";
    $("inUser").value=cfg.username||""; $("inPass").value=cfg.password||"";
    $("inClientId").value=cfg.clientId||""; $("inPrefix").value=cfg.prefix||"tek/";
    topicsFromCfg(getCfg()); $("saveHint").textContent="Kayıtlı ayarlar yüklendi.";
  }catch(e){}
}
function saveToStorage(){
  const cfg=getCfg();
  localStorage.setItem("emqx_ui_cfg",JSON.stringify(cfg));
  $("saveHint").textContent="Ayarlar kaydedildi (localStorage).";
  topicsFromCfg(cfg); log("Ayarlar kaydedildi.");
}
$("btnConnect").addEventListener("click",connect);
$("btnDisconnect").addEventListener("click",disconnect);
$("btnSave").addEventListener("click",saveToStorage);
$("btnAck").addEventListener("click",()=>window.__sendCmd({cmd:"ack"}));
$("btnMute").addEventListener("click",()=>window.__sendCmd({cmd:"mute"}));
$("btnReset").addEventListener("click",()=>window.__sendCmd({cmd:"reset"}));
$("btnMaintOn").addEventListener("click",()=>window.__sendCmd({cmd:"maint_on"}));
$("btnMaintOff").addEventListener("click",()=>window.__sendCmd({cmd:"maint_off"}));
setPill(false); setButtonsEnabled(false); loadFromStorage();
if(!$("inHost").value) $("inHost").value="fa1714ff.ala.eu-central-1.emqxsl.com";
if(!$("inPort").value) $("inPort").value="8084";
if(!$("inUser").value) $("inUser").value="master01";
if(!$("inPrefix").value) $("inPrefix").value="tek/";
topicsFromCfg(getCfg());
log("Hazır. Ayarları kontrol et ve 'Bağlan' bas.");
