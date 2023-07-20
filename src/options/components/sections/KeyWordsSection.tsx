import { useRecoilState } from 'recoil'
import { keywords } from '../../atoms'
import KeyWordCards from '../commonComponent/KeyWordCard'

const KeyWordsSection: React.FC = () => {
  const [keys, setKeywords] = useRecoilState(keywords)
  function exportToJson() {
    chrome.storage.local.get(['keywords']).then((res) => {
      const jsonString = JSON.stringify(res.keywords, null, 2)

      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.getElementById('export') as HTMLAnchorElement
      if (a) {
        a.href = url
        a.download = 'data.json'
        document.body.appendChild(a)
        a.click()
      }

      // Clean up
      URL.revokeObjectURL(url)
    })
  }

  function importFromJson() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement
    if (fileInput?.files?.length && fileInput?.files?.length > 0) {
      const file = fileInput.files[0]
      const reader = new FileReader()
      reader.onload = function (event: any) {
        const jsonData = JSON.parse(event.target.result)
        // Process the JSON data
        console.log({ jsonData })
        chrome.storage.local.set({ keywords: jsonData }).then(() => {
          setKeywords(jsonData)
        })
      }
      reader.readAsText(file)
    }
  }
  return (
    <div className="w-[1300px]">
      <div className="justify-center flex">
        <div className="text-2xl flex flex-col  gap-x-6">
          <div className="text-green-500 mt-3 justify-center font-bold">Keywords</div>
          <div>
            <button className="text-green-500">
              {`Import keywords: `}
              <input
                onClick={importFromJson}
                type="file"
                id="fileInput"
                className="text-sm text-stone-500
   file:mr-5 file:py-1 file:px-3 file:border-[1px]
   file:text-xs file:font-medium
   file:bg-stone-50 file:text-stone-700
   hover:file:cursor-pointer hover:file:bg-blue-50
   hover:file:text-blue-700"
              />
            </button>
            <button
              onClick={exportToJson}
              className="border border-1 border-green-500 rounded-md px-4 py-2 text-green-500 mt-3 font-bold"
            >
              <a id="export"></a>Export Keywords
            </button>
          </div>
        </div>
      </div>
      <div
        id="keywords"
        className="w-[90%] flex items-center mx-auto overflow-y-hidden justify-center"
      >
        <KeyWordCards />
      </div>
    </div>
  )
}
export default KeyWordsSection
