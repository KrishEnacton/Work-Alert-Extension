import { useContent } from '../../../customHooks/use-content'
import useOpJobs from '../../../customHooks/use-option-jobs'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface Proposal {
  name: string
}

export const ImportExportSection: React.FC<{}> = ({}) => {
  const { setLocalJobs, setLocalKeywords } = useOpJobs()
  const { setProposal, getProposals } = useContent()

  const [selectedImg, setSelectedImg] = useState<{
    proposal: Proposal | null
    keyword: Proposal | null
  }>({
    proposal: null,
    keyword: null,
  })

  const ImportExportConfig = [
    { id: 'keywords', label: 'Keywords', inputId: 'keywordInput', key: 'keyword' },
    { id: 'proposals', label: 'Profiles', inputId: 'proposalInput', key: 'proposal' },
  ]

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
    if (InputElem?.files?.length && InputElem?.files?.length > 0) {
      const file = InputElem.files[0]
      const reader = new FileReader()
      reader.onload = async function (event: any) {
        const jsonData = JSON.parse(event.target.result)
        // Process the JSON data
        if (jsonData.length > 0) {
          for (const i of jsonData[1]) {
            if (type == 'keywords') {
              await setLocalKeywords(i?.keyword, i?.rssLink)
              await setLocalJobs(i?.keyword, i?.rssLink)
            }
            if (type == 'proposals') {
              await setProposal([i])
            }
          }
        }
      }
      reader.readAsText(file)
    }
  }
  return (
    <div className="flex flex-col justify-between items-center p-4 mx-auto container">
      <div className="w-[600px] space-y-5">
        {ImportExportConfig.map((elem) => (
          <div className="col-span-full mt-8 space-y-5" key={elem.id}>
            <h2 className="text-2xl text-center font-bold ">{elem.label}</h2>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-400 p-6">
              <div className="text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-gray-500">
                  <label
                    htmlFor={elem.inputId}
                    className="relative cursor-pointer rounded-md font-semibold text-green-600 focus-within:outline-none focus-within:ring-1 focus-within:ring-green-600 focus-within:ring-offset-1"
                  >
                    <div className="text-green-500 w-[170px] hover:text-green-600">
                      {selectedImg && selectedImg[elem.key as keyof typeof selectedImg]?.name
                        ? selectedImg[elem.key as keyof typeof selectedImg]?.name
                        : `Upload ${elem.key} file`}
                    </div>

                    <input
                      id={elem.inputId}
                      onChange={(e: any) => {
                        importFromJson(elem.id)
                        setSelectedImg((prev) => ({ ...prev, [elem.key]: e.target.files[0] }))
                      }}
                      name={elem.inputId}
                      type="file"
                      accept="application/json"
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-sm leading-5 text-gray-500">Please upload json files only.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => exportToJson(elem.id)}
                className="font-bold w-[200px] rounded-md border text-lg border-green-400 px-6 py-2"
              >
                <a id="export"></a>Export {elem.label}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
