import en from './en'
import es from './es'

const localizeText = (lang) => {

	if(lang === 'en') {
		return en
	}

	if(lang === 'es') {
		return es
	}

	return en
}

export default localizeText