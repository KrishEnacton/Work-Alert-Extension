import { BinIcon } from '../../../util/Icons'
import useOpJobs from '../../../customHooks/use-option-jobs'
import { useRecoilState } from 'recoil'
import { clickedKeyword, isJobs, keywordCount, keywords } from '../../atoms'
import useBgJobs from '../../../customHooks/use-bg-job'
import { useEffect } from 'react'
import { keywordProps } from '../../../util/types'

const KeyWordCards = () => {
  const { allJobs, setLocalJobs, viewJobsHandler, deleteLocalJobs} = useOpJobs()
  const [isClick, setIsClicked] = useRecoilState(isJobs)
  const [clickKeyword, setClickKeyword] = useRecoilState(clickedKeyword)
  const [keywordsCount, setKeywordsCount] = useRecoilState(keywordCount)
  const [keys, setKeywords] = useRecoilState(keywords)

  const {getBgKeywords, getLocalKeywordsCount} = useBgJobs()
  const clickHandler = (key: any) => {
    setIsClicked(!isClick)
    setClickKeyword(key)
    viewJobsHandler(key)
  }

  useEffect(() => {
    getBgKeywords().then((res: any) => setKeywords(res))
    getLocalKeywordsCount().then((res:any) => {
      setKeywordsCount(res)
    })
  },[])

  return (
    <div className="flex flex-col gap-y-4 overflow-y-scroll h-[540px] py-2">
      {keys &&
        keys.map((item: keywordProps) => (
          <div key={item.keyword} className=" border border-green-400 rounded-md p-8 m-2">
            <div className="text-sm pl-12 text-gray-400">Keyword</div>
            <div className="flex justify-between text-lg">
              <div className="flex gap-x-6">
                <span onClick={() => deleteLocalJobs(item.keyword)}>
                  <BinIcon
                    fillColor="black"
                    className={'hover:cursor-pointer'}
                    strokeColor="gray"
                  />
                </span>
                <span
                  className="text-lg hover:underline hover:cursor-pointer"
                  onClick={() =>
                    clickHandler({
                      keyword: item.keyword,
                      jobs: item.jobs,
                      isClicked: true,
                      rssLink: item.rssLink,
                    })
                  }
                >
                  {item.keyword}
                </span>
              </div>
              <span className="text-lg text-black py-2 px-3 bg-green-500 rounded-full">
                {keywordsCount.find((key: any) => key.keyword === item.keyword)?.count}
              </span>
            </div>
          </div>
        ))}
    </div>
  )
}
export default KeyWordCards
