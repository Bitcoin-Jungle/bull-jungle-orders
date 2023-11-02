function autoFocusAndSelect(input) {
  if(input && input.focus && input.select) {
    input.focus();
    input.select();
  }
}

export default function TextEditor({
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