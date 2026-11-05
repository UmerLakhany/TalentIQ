import { Model, FindAndCountOptions } from 'sequelize';

interface MyObject {
  [key: string]: any;
}

interface WhereQuery {
  isDeleted?: boolean;
}

const modifyingPayload = (obj: MyObject) => {

  let newObj: MyObject = {}

  Object.keys(obj).forEach((elem: string) => {
    const value = obj[elem]
    newObj[elem] = (typeof value === 'string' && value?.includes('[')) ? JSON.parse(value) : value
  })

  return newObj
}

interface PaginatedData<T> {
  records: T[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

// Middleware function for pagination
const Paginate = async <T extends Model>(
  model: { findAndCountAll(options?: FindAndCountOptions): Promise<{ count: number; rows: T[] }> },
  pageNumber: number = 1,
  pageSize: number = 10,
  filter: MyObject = {},
  include: string[] | object[] = [],
  attributes: string[] = [],
  havingIsDeleted: boolean = true,
  raw: boolean = false,
): Promise<PaginatedData<T>> => {
  const offset = (pageNumber - 1) * pageSize;
  const limit = Number(pageSize);

  try {

    let whereQuery: MyObject & WhereQuery = {
      isDeleted: false,
      ...modifyingPayload(filter)
    }

    if (!havingIsDeleted) {
      delete whereQuery.isDeleted
    }

    const obj: any = {
      offset,
      limit,
      where: whereQuery,
      raw
    }

    if(include.length > 0) {
      obj["include"] = include
    }

    if (attributes.length > 0) {
      obj['attributes'] = attributes
    }

    const result = await model.findAndCountAll(obj);


    const { rows, count } = result;

    const totalPages = Math.ceil(count / pageSize);

    return {
      records: rows,
      currentPage: pageNumber,
      totalPages,
      totalRecords: count,
    };
  } catch (error) {
    console.log(error)
    throw new Error('Pagination failed');
  }
};

export default Paginate
