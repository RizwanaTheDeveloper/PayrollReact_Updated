import {useNavigate,useParams} from 'react-router-dom';
import EmployeeForm from '../components/EmployeeForm';
export default function Employees(){
  const nav=useNavigate(); const {employeeCode}=useParams();
  return <section className="card"><h1>{employeeCode?'Edit Employee':'Add Employee'}</h1><EmployeeForm employeeCode={employeeCode} onSaved={()=>nav('/')} onCancel={()=>nav('/')}/></section>
}
