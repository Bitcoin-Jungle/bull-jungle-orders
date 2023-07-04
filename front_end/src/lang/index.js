import en from './en'
import es from './es'

const localizeText = (lang) => {

	if(lang.indexOf('en') === 0) {
		return en
	}

	if(lang.indexOf('es') === 0) {
		return es
	}

	return en
}

export default localizeText