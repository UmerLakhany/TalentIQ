

interface ImethodAction {
  [key: string]: string;
}

interface IData {
  actions: string[];
  methodAction: ImethodAction
}

const Data: IData = {
  actions: ['Add', 'Edit', 'Delete', 'View','Accept', 'Reject'],
  methodAction: {
    'POST': 'add',
    'PUT': 'update',
    'DELETE': 'delete',
    'GET': 'view'
  }
}

export default Data