(function(){
  const screens = Array.from(document.querySelectorAll('.screen'))
  const show = id => {
    screens.forEach(s => s.classList.remove('active'))
    document.getElementById(id).classList.add('active')
  }

  // initial
  show('splash')

  // buttons
  document.getElementById('enterBtn').addEventListener('click', ()=> show('alias'))
  const settingsBtn = document.getElementById('settingsBtn')
  const aboutBtn = document.getElementById('aboutBtn')
  if(settingsBtn) settingsBtn.addEventListener('click', ()=> show('settings'))
  if(aboutBtn) aboutBtn.addEventListener('click', ()=> show('about'))
  document.getElementById('beginBtn').addEventListener('click', ()=>{
    const alias = document.getElementById('aliasInput').value || 'Agent_'
    window.player = { alias, xp: 0, rank: 'Script Kiddie', done:0 }
    updateProfile()
    show('console')
  })

  document.querySelectorAll('.menu-btn').forEach(btn=> btn.addEventListener('click', e=>{
    const action = e.currentTarget.dataset.action
    if(action==='missions') startMission()
    if(action==='tools') show('tools')
    if(action==='stats') show('stats')
    if(action==='exit') show('splash')
  }))

  document.querySelectorAll('[data-action="back"]').forEach(b=> b.addEventListener('click', ()=> show('console')))

  // settings persistence
  const textSizeInput = document.getElementById('textSize')
  const textSizeVal = document.getElementById('textSizeVal')
  const soundToggle = document.getElementById('soundToggle')
  const loadSettings = () => {
    const s = JSON.parse(localStorage.getItem('hacksim_settings')||'{}')
    const size = s.textSize || 100
    const sound = s.sound !== false
    if(textSizeInput){ textSizeInput.value = size; document.documentElement.style.setProperty('--text-zoom', size+'%'); }
    if(textSizeVal) textSizeVal.textContent = size+'%'
    if(soundToggle) soundToggle.checked = sound
  }
  const saveSettings = () => {
    const size = textSizeInput ? parseInt(textSizeInput.value,10) : 100
    const sound = soundToggle ? !!soundToggle.checked : true
    localStorage.setItem('hacksim_settings', JSON.stringify({ textSize: size, sound }))
  }
  if(textSizeInput){
    textSizeInput.addEventListener('input', ()=>{
      const val = parseInt(textSizeInput.value,10)
      if(textSizeVal) textSizeVal.textContent = val+'%'
      document.documentElement.style.setProperty('--text-zoom', val+'%')
      saveSettings()
    })
  }
  if(soundToggle){
    soundToggle.addEventListener('change', ()=> saveSettings())
  }
  loadSettings()

  // mission flow
  function startMission(){
    // set up a simple 'password' puzzle
    show('mission')
    document.getElementById('hashVal').textContent = 'ab34f21d09'
    document.getElementById('consoleOutput').textContent = '> Ready.'
    document.getElementById('cmdInput').value=''
    document.getElementById('missionResult').textContent=''
  }

  document.getElementById('runBtn').addEventListener('click', ()=>{
    const cmd = document.getElementById('cmdInput').value.trim().toLowerCase()
    const out = document.getElementById('consoleOutput')
    const result = document.getElementById('missionResult')

    // super-simple simulation: correct command contains "decrypt" and result "sunrise"
    if(cmd.includes('decrypt') || cmd.includes('crack')){
      out.textContent = '> Running decryptor...'
      setTimeout(()=>{
        const found = Math.random() > 0.3
        if(found){
          result.textContent = 'ACCESS GRANTED — password: sunrise'
          rewardSuccess()
        } else {
          result.textContent = 'Attempt failed. Try different pattern.'
        }
      }, 700)
    } else {
      result.textContent = 'No valid command detected. Try `run decrypt --pattern=...`'
    }
  })

  document.getElementById('hintBtn').addEventListener('click', ()=>{
    alert('Hint: password is a single English word related to dawn.')
  })
  document.getElementById('abortBtn').addEventListener('click', ()=> show('failed'))
  document.getElementById('retryBtn').addEventListener('click', ()=> startMission())

  function rewardSuccess(){
    window.player.xp += 150
    window.player.done += 1
    // simple rank progression
    if(window.player.xp >= 1000) window.player.rank = 'White Hat'
    else if(window.player.xp >= 400) window.player.rank = 'Pentester'
    else if(window.player.xp >= 150) window.player.rank = 'Apprentice'

    updateProfile()
    try { if(window.AndroidBridge){ AndroidBridge.vibrate(60); AndroidBridge.saveProgress(JSON.stringify(window.player)); } } catch(e){}
    // quick celebration
    document.getElementById('missionResult').style.background = '#063'
    setTimeout(()=> show('console'), 1200)
  }

  function updateProfile(){
    if(!window.player) return
    document.getElementById('rank').textContent = window.player.rank
    document.getElementById('xp').textContent = window.player.xp
    document.getElementById('sRank').textContent = window.player.rank
    document.getElementById('sXp').textContent = window.player.xp
    document.getElementById('sDone').textContent = window.player.done
  }

  // try restore progress on load
  try {
    if(window.AndroidBridge){
      const saved = AndroidBridge.loadProgress()
      if(saved){
        const p = JSON.parse(saved)
        window.player = Object.assign({ alias:'Agent_', xp:0, rank:'Script Kiddie', done:0 }, p)
        updateProfile()
      }
    }
  } catch(e){}

  // simple keyboard enter to run in mission
  document.getElementById('cmdInput').addEventListener('keydown', e=>{
    if(e.key === 'Enter') document.getElementById('runBtn').click()
  })

  // small UX nicety: exit splash on long-press or double tap
  document.getElementById('splash').addEventListener('dblclick', ()=> show('alias'))

})();


