import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Image from "next/image";
import logo from "../assets/logo.svg";

import { message } from '@tauri-apps/api/dialog';
import { Command } from '@tauri-apps/api/shell'

const Gallery = () => {

  const [images, setImages] = useState(["test"])

  useEffect(() => {
    const temp = []
    const get_images = async() => {
      const images = await invoke("list_images")
      for (let path in images) {
        if (!path.includes("grid") && !path.includes(".DS_Store") && path.includes(".png")) {
          temp.push(path)
        }
      }
    }
    setImages(temp)
    get_images()
  },[])

  return(
    <div className="right-content">
      <div className="gallery-head">
        <h1>Previous renders</h1>
      </div>
      <div className="stuff">
        {images.map((item,i) => {
          console.log(item)
          return(<p key={item}>{item}</p>)
        })}
        </div>
    </div>
  )
}
const Loader = () => {
  return(
    <div className="lds-hourglass"></div>
  )
}

const Home = () => {
  const [prompt, setPromt] = useState("a monkey as a DJ in space");
  const [isLoading, setLoading] = useState(false)
  const [seed, setSeed] = useState(42)

  function delay(t, v) {
    return new Promise(function(resolve) { 
        setTimeout(resolve.bind(null, v), t)
    });
  } 

  const generate = async() => {
    setLoading(true)

    const command = Command.sidecar("../sd/txt2img", [`--prompt=${prompt}`, "--plms", `--seed=${seed}`], {env:{"PYTORCH_ENABLE_MPS_FALLBACK" : "1"}})
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
      <input value={prompt} onChange={(e) => handleChange(e)}></input>
      <button className="play" onClick={generate}>Play!</button>

      {isLoading && <Loader />}
    </div>

    </div>
  )
}


function App() {

  const [isHome, setHome] = useState(true)

  async function images() {
    const res = await invoke("get_images")
    console.log(JSON.parse(res))
  } 

  async function write() {
     
    let data = {
      new_thing : 5
    }

    data = JSON.stringify(data)

    let res = await invoke("write_json", { data });
    console.log(res)
  }

  async function greet() {
    setGreetMsg(await invoke("run", { name }));
  }

  const handleClick = async() => {
    const thing = await invoke('play')
    console.log(thing)
    setGreetMsg(thing)
  }


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
            <button onClick={() => setHome(false)} className="menu-button">🖼️ <br/> Gallery</button>
          </div>

        </div>

        {isHome && <Home/>}
        {!isHome && <Gallery />}
        
      </div>
 
    </div>
  );
}

export default App;
