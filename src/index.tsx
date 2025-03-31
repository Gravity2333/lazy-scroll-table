import {createRoot} from 'react-dom/client'
import App from './App'

const fiberRootNode = createRoot(document.querySelector("#root")!)

fiberRootNode.render(<App/>)