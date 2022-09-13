import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Image from "next/image";
import logo from "../assets/logo.svg";

import { message } from '@tauri-apps/api/dialog';
import { Command } from '@tauri-apps/api/shell'
import { removeDir, createDir, writeTextFile, BaseDirectory, readTextFile } from '@tauri-apps/api/fs';

const Settings = ({setOutDir, outDir, setWeightsDir, weightsDir}) => {

  const [submitted, setSubmitted] = useState(false)

  const handleChangeOut = (e) => {
    e.preventDefault()
    setOutDir(e.target.value)
  }
  const handleChangeWeights = (e) => {
    e.preventDefault()
    setWeightsDir(e.target.value)
  }

  const submit = async() => {
    setSubmitted(false)
    const dirs = `outDir=${outDir},weightsDir=${weightsDir}`
    console.log(dirs)

    try{
      await removeDir('', { dir: BaseDirectory.App , recursive: true});
      await createDir('', { dir: BaseDirectory.App });
      await writeTextFile('app.conf', dirs, { dir: BaseDirectory.App });
    } catch {
      await createDir('', { dir: BaseDirectory.App });
      await writeTextFile('app.conf', dirs, { dir: BaseDirectory.App });   
    }
    setSubmitted(true)
  }

  return(
    <div className="right-content">
      <div className="gallery-head">
        <h1>Settings</h1>
      </div>
      <div className="stuff">
        <div className="stuff-container">
          <p>weights</p>
          <form>
            <input onChange={(e) => handleChangeWeights(e)} className="input-settings" defaultValue={weightsDir}></input>
          </form>
        </div>
        <div className="stuff-container">
          <p>output</p>
          <form>
            <input onChange={(e) => handleChangeOut(e)} className="input-settings" defaultValue={outDir}></input>
          </form>
        </div>

        <button onClick={submit} className="play-2">save changes</button>
        {submitted && <p>Changes saved!</p>}
      </div>
    </div>
  )
}
const Loader = () => {
  return(
    <div className="lds-hourglass"></div>
  )
}

const Home = ({outDir, weightsDir}) => {
  const [prompt, setPromt] = useState("");
  const [isLoading, setLoading] = useState(false)
  const [seed, setSeed] = useState(42)
  const [seconds, setSeconds] = useState(0);

  function reset() {
    setSeconds(0);
    setLoading(false);
  }

  useEffect(() => {
    let interval = null;
    if (isLoading) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 0.1);
      }, 100);
    } else if (!isLoading && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLoading, seconds]);

  const generate = async() => {
    console.log(weightsDir)
    console.log(outDir)

    reset()
    setLoading(true)

    const command = Command.sidecar("../sd/main", [`--prompt=${prompt}` ,`--ckpt=${weightsDir}`, `--outdir=${outDir}`])
    await command.execute()
    
    setLoading(false)
    await message('Image is done!', 'Playground');
  }

  const handleChange = (e) => {
    e.preventDefault()
    setPromt(e.target.value)
  }


  return(
    <div className="right-content">
    <div className="prompt-container">
      <input value={prompt} placeholder="a monkey as a DJ in space" onChange={(e) => handleChange(e)}></input>
      <button className="play" onClick={generate}>Play!</button>
      <p className="">Generation has taken {seconds.toFixed(1)} seconds</p>
      {isLoading && <Loader />}
    </div>

    </div>
  )
}


function App() {

  const [isHome, setHome] = useState(true)
  const [weightsDir, setWeightsDir] = useState(null)
  const [outDir, setOutDir] = useState(null)

  useEffect(() => {
    const checkDirs = async() => {

      try {
        const contents = await readTextFile('app.conf', { dir: BaseDirectory.App });
        const contentsArray = contents.split(",")

        setOutDir(contentsArray[0].split("=")[1])
        setWeightsDir(contentsArray[1].split("=")[1])

      } catch(dispatchException) {
        const desktopPath = await window.__TAURI__.path.desktopDir()
        const downloadPath = await window.__TAURI__.path.downloadDir()

        const defaultDirs = `outDir=${desktopPath}playground,weightsDir=${downloadPath}app/weights/model.ckpt`

        await createDir('', { dir: BaseDirectory.App });
        await writeTextFile('app.conf', defaultDirs, { dir: BaseDirectory.App });
      }
    }
    checkDirs()
  },[])

  return (
    <div className="main">
      {/* <Header /> */}
      <div className="content">
        <div className="left-content">

          <div className="logo-container">
            <Image src={logo} width={'70%'} height={'70%'}></Image>
          </div>

          <div className="button-container">
            <button onClick={() => setHome(true)} className="menu-button">🏠 <br/> Home</button>
          </div>

          <div className="button-container">
            <button onClick={() => setHome(false)} className="menu-button">🔧 <br/> Settings</button>
          </div>

        </div>

        {isHome && <Home outDir={outDir} weightsDir={weightsDir}/>}
        {!isHome && <Settings setOutDir={setOutDir} outDir={outDir} setWeightsDir={setWeightsDir} weightsDir={weightsDir}/>}
        
      </div>
 
    </div>
  );
}

export default App;
