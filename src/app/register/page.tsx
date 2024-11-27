import Register from './Register';
import { register } from '../server';

export default function RegisterPage() {
    return <Register register={register} />;
}