import React, { useState, useEffect } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import Chatbot from './Chatbot';
import './App.css';
import { v4 as uuidv4 } from 'uuid';
import beautify from "js-beautify";
import { Buffer } from 'buffer';
import piston from "piston-client";
import Spinner from 'react-bootstrap/Spinner';
import { GoogleGenerativeAI } from '@google/generative-ai';

const pistonClient = piston({ server: "https://emkc.org" });
const genAI = new GoogleGenerativeAI("");
const genModel1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const chat1 = genModel1.startChat({
  history: [{
    role: "user",
    parts: [{ text: "Hello" }],
  },
  {
    role: "model",
    parts: [{ text: "Great to meet you. What would you like to know?" }],
  }],
});
const genModel2 = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const chat2 = genModel2.startChat({
  history: [{
    role: "user",
    parts: [{ text: "Hello" }],
  },
  {
    role: "model",
    parts: [{ text: "Great to meet you. What would you like to know?" }],
  }],
});

function App() {
  const [model, selectModel] = useState("All AI Modal");
  const [userMessage, setUserMessage] = useState("");
  const [toggleBot, setToggleBot] = useState(true);
  const [template, setTemplate] = useState("");
  const [messages1, setMessages1] = useState([
    { id: uuidv4(), text: "Hello! How can I help you today?", sender: "bot" }
  ]);

  const [messages2, setMessages2] = useState([
    { id: uuidv4(), text: "Hello! How can I help you today?", sender: "bot" }
  ]);

  
  const [loader1, setLoader1] = useState(false);
  const [loader2, setLoader2] = useState(false);
  const [geminiFlash, setGeminiFlash] = useState(true);
  const [geminiPro, setGeminiPro] = useState(true);
  const [imageSelected, setImageSelected] = useState(null);

  
  const [runTimeEnv, setRunTimeEnv] = useState([]);
  const [selectEnv, setSelectEnv] = useState("");
  const [selectEnv2, setSelectEnv2] = useState("");
  const availableRuntimes = ["java", "javascript", "python", "typescript", "go", "c++", "python2", "c"];
  const [exeLoader, setExeLoader] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const runtimes = await pistonClient.runtimes();
        setRunTimeEnv(runtimes.filter(runtime=>!!availableRuntimes.includes(runtime.language.toLowerCase())));
      } catch (e) {
        console.log("Error occur while fetching runtime env : ", e);
      }
    })();
  }, [])
  

  const runGemini1Model = async prompt => {
    const result = await chat1.sendMessage(prompt);
    return result.response.text();
}

const runGemini2Model = async prompt => {
  const result = await chat2.sendMessage(prompt);
  return result.response.text();
}

    const generateGemini1Content = async prompt => {
          const result = await genModel1.generateContent([
              {
                  inlineData: {
                      data: Buffer.from(imageSelected).toString("base64"),
                      mimeType: "image/jpeg",
                  },
              },
              prompt,
          ]);
          await runGemini1Model(result.response.text() + " \n Add above content to chat history");
          return result.response.text();
    }

    const generateGemini2Content = async prompt => {
          const result = await genModel2.generateContent([
            {
                inlineData: {
                    data: Buffer.from(imageSelected).toString("base64"),
                    mimeType: "image/jpeg",
                },
            },
            prompt,
        ]);
        await runGemini2Model(result.response.text() + " \n Add above content to chat history");
        return result.response.text();
    }

    const handleUser1Message = async (userMessage) => {
      setLoader1(true);
      const prompt = (selectEnv==="" || selectEnv==="Any Language" || selectEnv==="None") ?userMessage:`Generate ${selectEnv} code for: ${userMessage}`;
      setUserMessage("");
      const newUserMessages = [
          ...messages1,
          { id: uuidv4(), text: userMessage, sender: "user", imageSelected },
      ];
      setMessages1(newUserMessages);
      let botResponse;
      try{
        botResponse = imageSelected ? await generateGemini1Content(prompt) : await runGemini1Model(prompt);
      } 
      catch (e){
        botResponse = "I didn't quite catch that, Would you mind repeating what you said?";
      }
        const newBotMessages = [
          ...messages1,
          { id: uuidv4(), text: userMessage, sender: "user", imageSelected },
          { id: uuidv4(), text: botResponse, sender: "bot" }
        ];
        setLoader1(false);
        setMessages1(newBotMessages);
    };

    const handleUser2Message = async (userMessage) => {
      setLoader2(true);
      const prompt = (selectEnv==="" || selectEnv==="Any Language" || selectEnv==="None") ?userMessage:`Generate ${selectEnv} code for: ${userMessage}`;
      setUserMessage("");
      const newUserMessages = [
          ...messages2,
          { id: uuidv4(), text: userMessage, sender: "user", imageSelected },
      ];
      setMessages2(newUserMessages);
      setTimeout(async()=>{
      let botResponse;
      try{
        botResponse = imageSelected ? await generateGemini2Content(prompt) : await runGemini2Model(prompt);
      } 
      catch (e){
        botResponse = "I didn't quite catch that, Would you mind repeating what you said?";
      }
        const newBotMessages = [
          ...messages2,
          { id: uuidv4(), text: userMessage, sender: "user", imageSelected },
          { id: uuidv4(), text: botResponse, sender: "bot" }
        ];
        setLoader2(false);
        setMessages2(newBotMessages);
      }, 600);
    };

    const executeCode = async () => {
      let response;
      const code = document.getElementById("codeEditor");
      const output = document.getElementById("codeOutput");
      let [language, version] = selectEnv2.split(':');
      try {
        setExeLoader(true);
        if(language.toLowerCase().includes("javascript")){
          output.value = eval(code.value);
        }
        else {
          response = await pistonClient.execute(language, code.value, { language: version });      
          if (response.run.stdout !== "") {
            output.value = response?.run?.stdout;
          }
          else if (response.run.stderr !== "") {
            output.value = response?.run?.stderr;
          }
        }
      }
      catch(e){
        if(language.toLowerCase().includes("javascript")){
          output.value = "Compilation Failed - " + e;
        }
        else {
          output.value = "Compilation Failed - " + e + response?.run?.stderr;
        }
      }
      setExeLoader(false);
    }

    const saveCode = () => {
      const text = document.getElementById("codeEditor").value;
      var blob = new Blob([text], { type: "javascript" });

      var a = document.createElement('a');
      a.download = "code.js";
      a.href = URL.createObjectURL(blob);
      a.dataset.downloadurl = ["javascript", a.download, a.href].join(':');
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    const generateTemplate = () => {
      const code = document.getElementById("codeEditor");
      try {
          const tem = beautify(template.replace("<code snippet>", `${code.value}`));
            code.value = tem;
      }
      catch(e){
          code.value = "Compilation Failed - " + e;
      }
    }


    const searchWithImage = (file) => {
      let fileData = new FileReader();
      fileData.onloadend = handleImage;
      fileData.readAsArrayBuffer(file);
    }

    const handleImage = async (e) => {
      const content = e.target.result;
      setImageSelected(content);
    }

    const handleFile = (e) => {
      const content = e.target.result;
      setTemplate(content);
    }

    const uploadTemplate = (file) => {
      let fileData = new FileReader();
      fileData.onloadend = handleFile;
      fileData.readAsText(file);
    }

    const copyCode = () => {
      const code = document.getElementById("codeEditor");
      const textArea = document.createElement("textarea");
      textArea.value = code.value;
      document.body.appendChild(textArea);
      
      // Select and copy the content
      textArea.select();
      document.execCommand("copy");
      
      // Remove the temporary text area element
      document.body.removeChild(textArea);
      showToast();
    }

    function showToast() {
      const toast = document.getElementById("toast");
      toast.classList.add("show");
    
      // Hide the toast after 3 seconds
      setTimeout(() => {
          toast.classList.remove("show");
      }, 3000);
    }

    const resetChat = () => {
      if(geminiFlash){
        setMessages1([
          { id: uuidv4(), text: "Hello! How can I help you today?", sender: "bot" }
        ]);
      }
      if(geminiPro){
        setMessages2([
          { id: uuidv4(), text: "Hello! How can I help you today?", sender: "bot" }
        ])
      }
    }

    const resetCode = () => {
      const code = document.getElementById("codeEditor");
      const out = document.getElementById("codeOutput");
      out.value="";
      code.value="";
    }

    const handleSelectRunTimeEnv = (event) => {
      const selectedEnv = event.target.value;
      setSelectEnv(selectedEnv); // Directly update state with the string (language:version)
    };

    const handleSelectRunTimeEnv2 = (event) => {
      const selectedEnv = event.target.value;
      setSelectEnv2(selectedEnv); // Directly update state with the string (language:version)
    };

    const modalTypes = ["All AI Modal", "Gemini 1.5 Flash", "Gemini 1.5 Pro"];
    
  return (
      <div style={{height:"99vh", width:"99vw"}}>
        <div id="toast" className="toast">Copied to clipboard</div>
        <Row style={{height:"7vh", backgroundColor:"darkslategrey"}}>
          <div style={{color: "white", fontSize: "large", textAlign: "left", marginTop: "10px", marginLeft:"10px"}}>
            Gen AI for Code Generation
          </div>
        </Row>
        <Row style={{height:"93vh"}}>
          <Col>
          
            <Row style={{height:"84%", padding:"10px", display:toggleBot?"none":"flex"}}>
            <InputGroup className="mb-3" style={{width:"100%", height:"70%"}}>
                     <Form.Control id="codeEditor"
                        style={{width:"100%", height:"100%"}} as="textarea" 
                        placeholder="Enter Code"
                        aria-describedby="basic-addon2"
                      />
            </InputGroup>
            <div style={{justifyContent: "center", height: "78px", display: "flex", width:"100%"}}>
            <div  style={{justifySelf:"center", display: "flex", width:"95%"}}>
                  <div>
                    <Form.Select aria-label="Default select example" value={selectEnv2} onChange={handleSelectRunTimeEnv2}>
                      <option value="" disabled>Select Environment</option>
                      {
                        runTimeEnv && runTimeEnv.map((env, index) => {
                          const value = `${env.language}:${env.version}`; // Concatenate language and version
                          return <option value={value} key={index}>{`${env.language}:${env.version}`}</option>;
                        })
                      }
                    </Form.Select>
                    <div style={{display:"flex", flexDirection:"row", width:"200px"}}>
                    <div className="tooltip" style={{width:"50%"}}>
                      <span className="tooltiptext">Execute</span>
                      <InputGroup.Text onClick={()=>{if(!exeLoader){executeCode()}}} style={{justifyContent:'center', height:"40px"}} id="basic-addon2" className="button-click">
                      {exeLoader ? <Spinner style={{color:"#B197FC"}} animation="border" role="status"/> :  <svg style={{width:"20px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="#B197FC" d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>}
                      </InputGroup.Text>
                    </div>
                    <div className="tooltip" style={{width:"50%"}}>
                      <span className="tooltiptext">Reset</span>
                      <InputGroup.Text onClick={()=>resetCode()} style={{justifyContent:'center', height:"100%"}} id="basic-addon2" className="button-click">
                        <svg style={{width:"20px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#B197FC" d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"/></svg>
                      </InputGroup.Text>
                      </div>
                    </div>
                  </div>
                  <InputGroup className="mb-3">
                    <InputGroup.Text id="basic-addon1" >Output</InputGroup.Text>
                      <Form.Control
                      id="codeOutput" 
                      as="textarea"
                      />
                  </InputGroup>
                  <div>
                  <Form.Group style={{ width:"250px"}} controlId="formFile" className="mb-3">
                    <Form.Control onChange={(e)=> uploadTemplate(e.target.files[0])} type="file" />
                  </Form.Group>
                  <div style={{display:"flex"}}>
                    <div className="tooltip" style={{width:"33%", pointerEvents:(!template)?"none":"all"}}>
                        <span className="tooltiptext">{`Replaces <code snippet> string with code`}</span>
                        <InputGroup.Text onClick={()=>generateTemplate()} style={{justifyContent:'center'}} id="basic-addon2" className="button-click">
                          <svg style={{width:"20px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="#B197FC" d="M280 64l40 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 128C0 92.7 28.7 64 64 64l40 0 9.6 0C121 27.5 153.3 0 192 0s71 27.5 78.4 64l9.6 0zM64 112c-8.8 0-16 7.2-16 16l0 320c0 8.8 7.2 16 16 16l256 0c8.8 0 16-7.2 16-16l0-320c0-8.8-7.2-16-16-16l-16 0 0 24c0 13.3-10.7 24-24 24l-88 0-88 0c-13.3 0-24-10.7-24-24l0-24-16 0zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"/></svg>
                        </InputGroup.Text>
                    </div>
                    <div className="tooltip" style={{width:"33%", pointerEvents:(!template)?"none":"all"}}>
                      <span className="tooltiptext" >Copy to Clipboard</span>
                      <InputGroup.Text onClick={()=>copyCode()} style={{justifyContent:'center'}} id="basic-addon2" className="button-click">
                        <svg style={{width:"20px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="#B197FC" d="M208 0L332.1 0c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9L448 336c0 26.5-21.5 48-48 48l-192 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48zM48 128l80 0 0 64-64 0 0 256 192 0 0-32 64 0 0 48c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 176c0-26.5 21.5-48 48-48z"/></svg>
                      </InputGroup.Text>
                    </div>
                    <div className="tooltip" style={{width:"34%", pointerEvents:(!template)?"none":"all"}}>
                      <span className="tooltiptext">Save</span>
                      <InputGroup.Text onClick={()=>saveCode()} style={{justifyContent:'center'}} id="basic-addon2" className="button-click">
                        <svg style={{width:"20px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="#B197FC" d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>
                      </InputGroup.Text>
                    </div>
                  </div>
                  </div>
            </div >
            </div>
            </Row>
         
            <Row style={{height:"84%", padding:"10px", display:toggleBot?"flex":"none"}}>
              {(model==="All AI Modal" || model==="Gemini 1.5 Flash") && (<Col style={{display: "flex", flexDirection: "row", justifyContent: "center", width:"600px"}}>
                <div style={{width:"100%", height:"100%", padding:"10px", backgroundColor:"#e5dce8", maxWidth: "720px"}}>
                <div style={{color: "black", fontSize: "x-large", textAlign: "center", marginBottom: "5px", borderBottom:"2px solid grey", display: "inline-flex", width: "100%", justifyContent: "space-between"}}>
                <Form.Check
                  type="switch"
                  id="Gemini 1.5 Flash"
                  label=""
                  onChange={(e)=>setGeminiFlash(e.target.checked)}
                  checked={geminiFlash}
                /> Gemini 1.5 Flash
                </div>
                  <Chatbot messages={messages1} loader={loader1}/>
                  
                </div>
              </Col>)}
              {(model==="All AI Modal" || model==="Gemini 1.5 Pro") && (<Col style={{display: "flex", flexDirection: "row", justifyContent: "center", width:"600px"}}>
              <div style={{width:"100%", height:"100%", padding:"10px", backgroundColor:"#e5dce8", maxWidth: "720px"}}>
                <div style={{color: "black", fontSize: "x-large", textAlign: "center", marginBottom: "5px", borderBottom:"2px solid grey", display: "inline-flex", width: "100%", justifyContent: "space-between"}}>   
                <Form.Check
                  type="switch"
                  id="Gemini 1.5 Pro"
                  label=""
                  onChange={(e)=>setGeminiPro(e.target.checked)}
                  checked={geminiPro}
                /> Gemini 1.5 Pro
                  </div>
                <Chatbot messages={messages2} loader={loader2}/>
               
              </div>
              </Col>)}
            </Row>
            <Row style={{height:"50px", width: "95%", display: "flex", justifySelf: "center"}}>
              <InputGroup className="mb-3" style={{marginBottom:"0rem !important"}}>
              <div className="tooltip" style={{height:"100%"}}>
              <span className="tooltiptext">{toggleBot? "Generate Template": "Generate Code"}</span>
                  <InputGroup.Text style={{height:"100%"}} className="button-click" onClick={() => setToggleBot(!toggleBot)} id="basic-addon2">
                      {toggleBot && (<svg style={{width:"20px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="#B197FC" d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 288c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128z"/></svg>)}
                      {!toggleBot && (<svg style={{width:"20px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#B197FC" d="M160 368c26.5 0 48 21.5 48 48l0 16 72.5-54.4c8.3-6.2 18.4-9.6 28.8-9.6L448 368c8.8 0 16-7.2 16-16l0-288c0-8.8-7.2-16-16-16L64 48c-8.8 0-16 7.2-16 16l0 288c0 8.8 7.2 16 16 16l96 0zm48 124l-.2 .2-5.1 3.8-17.1 12.8c-4.8 3.6-11.3 4.2-16.8 1.5s-8.8-8.2-8.8-14.3l0-21.3 0-6.4 0-.3 0-4 0-48-48 0-48 0c-35.3 0-64-28.7-64-64L0 64C0 28.7 28.7 0 64 0L448 0c35.3 0 64 28.7 64 64l0 288c0 35.3-28.7 64-64 64l-138.7 0L208 492z"/></svg>)}
                  </InputGroup.Text>
                  </div>
                  <div>
                    <div style={{display:"flex", flexDirection:"row"}}>
                    <InputGroup.Text id="basic-addon2" className="button-click" style={{pointerEvents:(loader1 || loader2 || !toggleBot)?"none":"all"}}>
                      <OverlayTrigger
                      rootClose={true}
                          trigger="click"
                          key="top"
                          placement="top"
                          overlay={
                            <Popover id={`popover-positioned-top`}>
                              <Popover.Body>
                                <Form.Group style={{marginRight: "7px"}} controlId="formFile" className="mb-3">
                                    <Form.Control onChange={(e)=> searchWithImage(e.target.files[0])} type="file" />
                                  </Form.Group>
                              </Popover.Body>
                            </Popover>
                          }
                        >
                        <div className="tooltip">
                          <span className="tooltiptext">{imageSelected ? "Image Uploaded": "Upload Image"}</span>
                          {imageSelected && ( <svg style={{width:"20px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#B197FC" d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"/></svg>)}
                          {!imageSelected && ( <svg style={{width:"20px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#B197FC" d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3 192 320c0 17.7 14.3 32 32 32s32-14.3 32-32l0-210.7 73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-64z"/></svg>)}
                        </div>
                        </OverlayTrigger>
                      </InputGroup.Text>
                      <Form.Select disabled={!toggleBot} style={{width: "192px"}} aria-label="Default select example" value={model} onChange={e=>selectModel(e.target.value)}>
                      <option value="" disabled>Select AI Modal</option>
                        {
                          modalTypes && modalTypes.map((modal, index) => {
                            return <option value={modal} key={index}>{modal}</option>;
                          })
                        }
                      </Form.Select>
                    </div>
                    <div style={{display:"flex", flexDirection:"row"}}>
                      <InputGroup.Text style={{pointerEvents:(loader1 || loader2 || !toggleBot)?"none":"all"}} onClick={() => resetChat()} id="basic-addon2" className="button-click">
                        <div className="tooltip">
                          <span className="tooltiptext">Reset Chat</span>
                          <svg style={{width:"20px", pointerEvents:(loader1 || loader2 || !toggleBot)?"none":"all"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#B197FC" d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"/></svg>
                        </div>
                      </InputGroup.Text>
                      <Form.Select disabled={!toggleBot} style={{width:"192px"}} aria-label="Default select example" value={selectEnv} onChange={handleSelectRunTimeEnv}>
                        <option value="" disabled>Select Language</option>
                        <option value="None">None</option>
                        <option value="Any Language">Any Language</option>
                        {
                          runTimeEnv && runTimeEnv.map((env, index) => {
                            const value = env.language; // Concatenate language and version
                            return <option value={value} key={index}>{`${env.language} ${env.version}`}</option>;
                          })
                        }
                      </Form.Select>
                    </div>
                  </div>
                    <Form.Control disabled={!toggleBot} as="textarea" value={userMessage} onChange={e=>setUserMessage(e.target.value)}
                      placeholder="Enter Message"
                      aria-describedby="basic-addon2"
                    />
                    <div className="tooltip" style={{ pointerEvents:(loader1 || loader2 || !toggleBot)?"none":"all"}}>
                        <span className="tooltiptext">Send</span>
                        <InputGroup.Text className="button-click" id="basic-addon2" style={{height: "100%"}} onClick={()=>{
                          if(geminiFlash){
                            handleUser1Message(userMessage);
                          }
                          if(geminiPro){
                            handleUser2Message(userMessage);
                          }
                          setImageSelected(null);
                          }}>
                          {(loader1 || loader2) ?<Spinner style={{color:"#B197FC"}} animation="border" role="status"/>:<svg  style={{width:"46px", height:"25px"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#B197FC" d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/></svg>}
                        </InputGroup.Text>
                      </div>
              </InputGroup>

            </Row>
          </Col>
        </Row>
    </div>
  );
}

export default App;
