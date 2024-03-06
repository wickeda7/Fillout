import e, { Request, Response, NextFunction } from 'express';
import * as dotevnv from 'dotenv';
const axios = require('axios');

dotevnv.config();
const API_KEY = process.env.API_KEY;
const FORM_ID = process.env.FORM_ID;

type ResponseType = {
  submissionId: string;
  submissionTime: string;
  lastUpdatedAt: string;
  questions: QuestionsType[];
  calculations: [];
  urlParameters: FilterClauseType[];
  quiz: {};
  documents: [];
};

type FilterClauseType = {
  id: string;
  condition: string;
  value: number | string;
};
type QuestionsType = {
  id: string;
  name: string;
  type: string;
  value: string | number | null;
};
type keyValObj = {
  [key: string]: any;
};
type ResponseFilter = {
  responseFiltersType: keyValObj[];
};

const getForm = async (formId: String) => {
  try {
    const response = await axios.get(`https://api.fillout.com/v1/api/forms/${formId}/submissions`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    return response.data;
  } catch (err) {
    console.log('error!!!!', err);
    throw err;
  }
};

const filteredResponses = async (req: Request, res: Response, next: NextFunction) => {
  const formId = req.params.id;
  const filter = req.query.filter as FilterClauseType[];
  const limit = Number(req.query.limit);

  try {
    const data = await getForm(formId);
    const dataRes = data.responses as ResponseType[];
    const filteredRes = filterResponse(dataRes, filter) as unknown as ResponseType[];
    return res.status(200).json({
      responses: filteredRes,
      totalResponses: filteredRes.length,
      pageCount: Math.ceil(filteredRes.length / limit),
    });
  } catch (error) {
    next(error);
  }
};
const compare = (a: any, b: any, operator: string) => {
  const val = isNaN(b * 1);
  if (operator === 'equals') {
    if (val) return a === b;
    else return a === b || a === +b;
  } else if (operator === 'does_not_equal') {
    if (val) return a !== b;
    else return a !== b || a !== +b;
  } else if (operator === 'greater_than') {
    if (val) return a > b;
    else return a > b || a > +b;
  } else if (operator === 'less_than') {
    if (val) return a < b;
    else return a < b || a < +b;
  } else throw 'Unknown operator';
};
const filterResponse = (arr: ResponseType[], filter: FilterClauseType[]) => {
  let result: ResponseType[] = [];
  filter.forEach((param: FilterClauseType) => {
    arr.forEach((elem: ResponseType) => {
      const { questions, submissionId } = elem;
      questions.filter((question: QuestionsType) => {
        if (question.id === param.id && compare(question.value, param.value, param.condition)) {
          let map = result.reduce((acc, obj, idx) => acc.set(obj.submissionId, idx), new Map());
          if (map.has(submissionId)) {
            let idx = map.get(submissionId);
            result[idx] = {
              ...result[idx],
              questions: [...result[idx].questions, question],
              urlParameters: [...result[idx].urlParameters, param],
            };
          } else {
            result.push({ ...elem, urlParameters: [param], questions: [question] });
          }
        }
      });
    });
  });
  return result;
};

export default { getForm, filteredResponses };
