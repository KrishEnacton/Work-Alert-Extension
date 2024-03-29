import XMLParser from 'fast-xml-parser'
import { jobsProps, keywordProps } from './types'
import he from 'he'
const parser = new XMLParser.XMLParser()

export const getAllJobsData = async (keywords: keywordProps) => {
  let filtered: jobsProps[] = []

  const url = keywords.rssLink
  try {
    if (url) {
      await fetch(`${url}&random=${Math.random()}`, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
        .then((response) => response.text())
        .then((response) => {
          const original = response
          let xmlJobList = parser.parse(original)

          xmlJobList.rss.channel.item.map((item: jobsProps) =>
            filtered.push({
              title: item.title.replace(' - Upwork', ''),
              link: item.link,
              date: new Date(
                (item.description.match(/<b>Posted On<\/b>: ([^<]+)/) || [
                  null,
                  new Date().toUTCString(),
                ])[1],
              ).toJSON(),
              budget: (item.description.match(/<b>Budget<\/b>: ([^<]+)/) || [null, null])[1],
              hourly: (item.description.match(/<b>Hourly Range<\/b>: ([^<]+)/) || [null, null])[1],
              description: item.description
                .replace(/< b>Posted On<\/b>: [^<]+<br \/>/, '')
                .replace(/<b>Budget<\/b>: [^<]+<br \/>/, '')
                .replace(/<b>Hourly Range<\/b>: [^<]+<br \/>/, '')
                .replace(/<b>Hourly Range<\/b>: [^<]+<br \/>/, '')
                .replace(/<b>Skills<\/b>:([^<]+)/, '')
                .replace(/<b>Country<\/b>:([^<]+)/, '')
                .replace(/<b>Category<\/b>:([^<]+)/, '')
                .replace(/<b>posted on<\/b>:([^<]+)/i, '')
                .replace(/<a href="([^]+)/, '')
                .replace(/(<br \/>)+/g, '')
                .replace(/(&nbsp;)+/g, ''),
              uid: item.guid && item.guid,
              keyword: keywords.keyword,
              notification_triggered: false,
            }),
          )
        })
        .catch((error) => {
          console.log(error)
        })
    }
  } catch (err) {
    console.error(err)
  }

  return filtered
}

export function compareArrays(previousJob: any, newJob: any) {
  let uniqueJobs = []
  for (let i = 0; i < newJob?.length; i++) {
    let flag = false
    for (let j = 0; j < previousJob?.length; ++j) {
      if (
        newJob[i]['uid'] == previousJob[j]['uid'] &&
        newJob[i]['keyword'] == previousJob[j]['keyword']
      ) {
        flag = true
      }
    }
    if (!flag) {
      uniqueJobs.push(newJob[i])
    }
  }
  return uniqueJobs
}

const handleHTMLcoding = (text: string) => {
  return he.decode(text)
}

export const truncate = (string: string) => {
  const decodedText = handleHTMLcoding(string)
  return decodedText.length > 190 ? decodedText.substring(0, 190) + ' ...' : decodedText
}

export const timeRange = (time: string): { range: string | number; type: string } => {
  const range: number = Date.now() - Number(new Date(time))
  const hours: number = Math.floor(range / (60 * 60 * 1000))
  if (hours > 24) return { range: Math.floor(hours / 24), type: 'days' }
  if (hours === 0) return { range: Math.floor(range / (60 * 1000)), type: 'minutes' }
  else return { range: hours.toFixed(0), type: 'hours' }
}

export function countJobsKeywords(arr: jobsProps[]): { [keyword: string]: number } {
  const counts: { [keyword: string]: number } = {}
  for (let i = 0; i < arr?.length; i++) {
    const keyword = arr[i].keyword
    counts[keyword] = (counts[keyword] || 0) + 1
  }
  return counts
}

export const compareJobs = (
  previousAllJobs: {
    [key: string]: any
  },
  newAllJobs: any,
) => {
  const allKeywordJobs: any[] = []
  previousAllJobs?.jobsByKeyword &&
    previousAllJobs?.jobsByKeyword?.map((keyword: keywordProps) => {
      let jobs = newAllJobs.find((key: any) => key.keyword === keyword.keyword)
      const newJobs = compareArrays(keyword.jobs, jobs?.jobs ? jobs.jobs : [])
      if (newJobs?.length) {
        newJobs.forEach((element) => {
          allKeywordJobs.push(element)
        })
      }
    })
  return allKeywordJobs
}

export const notify = (keywordObject: { [keyword: string]: number }) => {
  let message = ''
  for (const [keyword, value] of Object.entries(keywordObject)) {
    message += `${keyword} - ${value} \n`
  }
  chrome.notifications.create(
    {
      type: 'basic',
      title: 'New jobs have been added🛎️',
      message: message,
      iconUrl: chrome.runtime.getURL('/img/enacton.png'),
      requireInteraction: true,
    },
    () => {},
  )
}

export const separateCounts = (arr: any) => {
  const dict: any = {}
  for (let i = 0; i < arr?.length; i++) {
    const keyword = arr[i].keyword
    if (dict.hasOwnProperty(keyword)) {
      dict[keyword]++
    } else {
      dict[keyword] = 1
    }
  }

  const result = []

  for (let keyword in dict) {
    const count = dict[keyword]
    result.push({ keyword, count })
  }
  return result
}
