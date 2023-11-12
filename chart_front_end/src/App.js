import './App.css';
import Chart from './Chart'
import { localizeText } from './lang'
import { getApiKey, getLanguage } from './utils'

function App() {
  const apiKey = getApiKey()
  const language = getLanguage()
  const localized = localizeText(language)

  return (
    <div className="page">
      <a 
        href="#" 
        onClick={(e) => {
          e.preventDefault()
          window.history.back()
        }}
      >
        {localized.back}
      </a>
      <div className="App">
        <Chart 
          localized={localized} 
          language={language}
          apiKey={apiKey}
        />
      </div>
    </div>
  );
}

export default App;
