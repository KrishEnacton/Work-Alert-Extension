import { useRecoilState } from 'recoil'
import { useContent } from '../../../customHooks/use-content'
import useOpJobs from '../../../customHooks/use-option-jobs'
import { proposals } from '../../atoms'

export const ImportExportSection: React.FC<{}> = ({}) => {
  const [allProposals, setAllProposals] = useRecoilState(proposals)
  const { setLocalJobs, setLocalKeywords } = useOpJobs()
  const { setProposal, getProposals } = useContent()

  function exportToJson(type: string) {
    chrome.storage.local.get(['keywords', 'proposals']).then((res) => {
      const result = Object.entries(res).find((item) => item?.[0] === type)
      const jsonString = JSON.stringify(result, null, 2)

      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.getElementById('export') as HTMLAnchorElement
      if (a) {
        a.href = url
        a.download = `${type}.json`
        document.body.appendChild(a)
        a.click()
      }

      // Clean up
      URL.revokeObjectURL(url)
    })
  }

  function importFromJson(type: string) {
    const InputElem = (
      type == 'keywords'
        ? document.getElementById('keywordInput')
        : document.getElementById('proposalInput')
    ) as HTMLInputElement
    console.log(type, InputElem.files)
    if (InputElem?.files?.length && InputElem?.files?.length > 0) {
      const file = InputElem.files[0]
      const reader = new FileReader()
      reader.onload = async function (event: any) {
        const jsonData = JSON.parse(event.target.result)
        // Process the JSON data
        console.log({ jsonData })
        if (jsonData.length > 0) {
          for (const i of jsonData) {
            if (type == 'keywords') {
              await setLocalKeywords(i?.keyword, i?.rssLink)
              await setLocalJobs(i?.keyword, i?.rssLink)
            }
            if (type == 'proposals') {
              await setProposal(i)
            }
          }
        }
      }
      reader.readAsText(file)
    }
  }
  return (
    <div className="flex flex-col justify-between items-center p-4 mx-auto container">
      <div className="flex flex-col text-xl py-4">
        <h2 className="text-2xl font-bold py-4">Keywords</h2>
        <div className="flex">
          <button className="flex gap-x-3">
            <span className="font-bold">Import</span>
            <input
              type="file"
              id="keywordInput"
              onChange={() => importFromJson('keywords')}
              className="block w-full text-sm text-slate-500
        file:mr-4 file:py-2 file:px-4 file:rounded-md
        file:border-0 file:text-sm file:font-semibold
        file:bg-green-50 file:text-green-700
        hover:file:bg-green-100 cursor-pointer"
            />
          </button>
          <button
            onClick={() => exportToJson('keywords')}
            className="font-bold rounded-md border border-green-400 px-6 py-2"
          >
            <a id="export"></a>Export Keywords
          </button>
        </div>
      </div>
      <div className="flex flex-col text-xl py-4">
        <h2 className="text-2xl font-bold py-4">Profiles</h2>
        <div className="flex">
          <button className="flex gap-x-3">
            <span className="font-bold">Import</span>
            <input
              type="file"
              onChange={() => importFromJson('proposals')}
              id="proposalInput"
              className="block w-full text-sm text-slate-500
        file:mr-4 file:py-2 file:px-4 file:rounded-md
        file:border-0 file:text-sm file:font-semibold
        file:bg-green-50 file:text-green-700
        hover:file:bg-green-100 cursor-pointer"
            />
          </button>
          <button
            onClick={() => exportToJson('proposals')}
            className="font-bold rounded-md border border-green-400 px-6 py-2"
          >
            <a id="export"></a>Export Profiles
          </button>
        </div>
      </div>
    </div>
  )
}
