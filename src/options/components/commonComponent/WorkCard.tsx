import { useState } from 'react'
import { timeRange, truncate } from '../../../util'
import { jobsProps } from '../../../util/types'

const WorkCard = (props: any) => {
  const [readMoreClicked, setReadMoreClicked] = useState(false)
  const [clickedValue, setClickedValue] = useState<string | undefined>('')
  let jobs = props.props.props.jobs
  console.log(props, 'card props')
  return (
    <div className="flex flex-col overflow-y-scroll h-[440px] gap-y-4">
      {jobs.map((item: jobsProps) => (
        <div className="text-green-500 bg-custom-bg  rounded-md p-5 h-auto">
          <div className="flex text-lg justify-between px-2 w-full text-gray-500">
            <div>
              {item.date && typeof timeRange(item.date.toString()) === 'number'
                ? `${timeRange(item.date.toString())} minutes ago`
                : `${timeRange(item.date.toString())} hours ago`}
            </div>
            <div>{item.budget}</div>
          </div>
          <div className="text-white text-2xl pt-4 pl-4 font-extrabold">{item.title}</div>
          <div className="text-gray-400">
            <p className="text-16 pt-4 pl-4">
              {item.description && readMoreClicked && item.uid === clickedValue
                ? item.description
                : truncate(item.description)}
            </p>
          </div>
          <div
            onClick={() => {
              setReadMoreClicked((prev) => !prev)
              console.log(item.uid)
              setClickedValue(item.uid)
            }}
            className="font-bold text-lg pl-4 mt-4 hover:cursor-pointer"
          >
            {readMoreClicked && item.uid === clickedValue ? 'Hide Details' : 'Read More'}
          </div>
        </div>
      ))}
    </div>
  )
}

export default WorkCard
