import 'react-data-grid/lib/styles.css'

import { useState, useEffect, useMemo, createContext, useContext } from 'react'
import DataGrid from 'react-data-grid'
import { Tooltip } from 'react-tooltip'
import * as csv from 'csv/browser/esm/sync'

import { getApiKey } from './utils/index'

const FilterContext = createContext(undefined)

function inputStopPropagation(event) {
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.stopPropagation();
  }
}

function PhoneNumbers({}) {
  const [apiKey, setApiKey] = useState(getApiKey())
  const [phoneNumbers, setPhoneNumbers] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    id: '',
    phoneNumber: '',
    daily_buy_limit: '',
    daily_sell_limit: '',
  })


  const getPhoneNumbers = () => {
    if(loading) {
      return 
    }

    setLoading(true)

    fetch(`/phoneNumbers?apiKey=${apiKey}`)
    .then((res) => res.json())
    .then((data) => {
      if(data.error) {
        alert(data.message)
        return
      }

      setPhoneNumbers(data.data)
    })
    .catch((e) => {
      alert("ERROR")
    })
    .finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => {
    getPhoneNumbers()
  }, [])


  const columns = useMemo(() => {
    if(!phoneNumbers.length) {
      return []
    }

    return Object.keys(phoneNumbers[0]).map((value) => {
      const obj = {
        key: value,
        name: value,
        resizable: true,
        headerCellClass: "filter-column",
        renderCell(props) {
          let cell = props.row[props.column.key]
          const id = (Math.random() + 1).toString(36).substring(7)

          return (
            <>
              <span id={`cell-${id}`}>{cell}</span>
              <Tooltip 
                anchorSelect={`#cell-${id}`} 
                place="bottom" 
                content={cell} 
                positionStrategy="fixed" 
                style={{zIndex: 1000}} 
                className="unselectable"
                render={() => {
                  return (
                    <span className="unselectable">{cell}</span>
                  )
                }}
              />
            </>
          )
        },
        renderHeaderCell(p) {
          const col = p.column.key

          if(typeof filters[col] === 'undefined') {
            return (
              <div>{p.column.name}</div>
            )
          }

          return (
            <FilterRenderer {...p}>
              {({ ...rest }) => (
                <input
                  {...rest}
                  className="filterInput"
                  value={filters[col] ?? filters[col]}
                  placeholder="Search..."
                  onChange={(e) => {
                    const newObj = {...filters}
                    newObj[col] = e.target.value.toString()
                    setFilters(newObj)
                  }}
                  onKeyDown={inputStopPropagation}
                />
              )}
            </FilterRenderer>
          )
        }
      }

      if(value !== 'id') {
        obj.renderEditCell = textEditor
      }

      return obj
    })
  }, [filters, phoneNumbers])

  const filteredRows = useMemo(() => {
    if(!filters.phoneNumber.length && !filters.daily_buy_limit.length && !filters.daily_sell_limit.length && !filters.id.length) {
      return phoneNumbers
    }

    return phoneNumbers.filter((r) => {
      return (
        (filters.phoneNumber.length ? r.phoneNumber.indexOf(filters.phoneNumber) !== -1 : true) &&
        (filters.daily_buy_limit.length ? r.daily_buy_limit.toString().indexOf(filters.daily_buy_limit) !== -1 : true) &&
        (filters.daily_sell_limit.length ? r.daily_sell_limit.toString().indexOf(filters.daily_sell_limit) !== -1 : true) &&
        (filters.id.length ? r.id.toString().indexOf(filters.id) !== -1 : true)
      );
    });
  }, [phoneNumbers, filters])

  function clearFilters() {
    setFilters({
      id: '',
      phoneNumber: '',
      daily_buy_limit: '',
      daily_sell_limit: '',
    });
  }


  const exportCSV = () => {
    const output = csv.stringify([
      columns.map((col) => col.key),
      ...phoneNumbers.map((order) => Object.values(order)),
    ])

    let blobx = new Blob([output], { type: 'text/csv' }); // ! Blob
    let elemx = window.document.createElement('a');
    elemx.href = window.URL.createObjectURL(blobx); // ! createObjectURL
    elemx.download = "phoneNumbers.csv";
    elemx.style.display = 'none';
    document.body.appendChild(elemx);
    elemx.click();
    document.body.removeChild(elemx);
  }

  const handleEditRows = (rows, change) => {
    const field = change.column.key
    const row = rows[change.indexes[0]]
    const id = row.id
    const newVal = row[field]
    const data = {}
    data[field] = newVal

    fetch('/phoneNumber', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey,
        id,
        data,
      })
    })
    .then(res => res.json())
    .then(res => {
      if(res.error) {
        alert(res.message)
      }
    })
    .then(getPhoneNumbers)
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col">
          <div className="mb-3">
            <div className="row">
              <div className="col-4">
                <button className="btn btn-primary from-control" onClick={() => exportCSV() }>
                  Export CSV
                </button>
              </div>
            </div>
          </div> 

          {loading &&
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          }
          {!loading && phoneNumbers.length > 0 &&
            <div>
              <div className="mb-3">
                <DataGrid 
                  style={{height: "80vh"}}
                  columns={columns}
                  rows={filteredRows}
                  headerRowHeight={70}
                  onRowsChange={handleEditRows}
                  onCellClick={(args, event) => {
                    if (args.column.key === 'id') {
                      event.preventGridDefault();
                      args.selectCell(true);
                    }
                  }} />
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  )
}

function autoFocusAndSelect(input) {
  if(input && input.focus && input.select) {
    input.focus();
    input.select();
  }
}

function textEditor({
  row,
  column,
  onRowChange,
  onClose
}) {
  return (
    <input
      // className={textEditorClassname}
      ref={autoFocusAndSelect}
      value={row[column.key]}
      onChange={(event) => onRowChange({ ...row, [column.key]: event.target.value })}
      onBlur={() => onClose(true, false)}
    />
  );
}

function FilterRenderer({ tabIndex, column, children}) {
  const filters = useContext(FilterContext)

  return (
    <>
      <div>{column.name}</div>
     {children({ tabIndex, filters })}
    </>
  );
}

export default PhoneNumbers