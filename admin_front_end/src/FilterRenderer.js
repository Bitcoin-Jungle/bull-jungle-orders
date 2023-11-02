import { createContext, useContext } from 'react'

const FilterContext = createContext(undefined)

export default function FilterRenderer({ tabIndex, column, children}) {
  const filters = useContext(FilterContext)

  return (
    <>
      <div>{column.name}</div>
      {children({ tabIndex, filters })}
    </>
  );
}