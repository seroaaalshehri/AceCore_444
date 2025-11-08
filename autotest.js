import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 277,                
  iterations: 500,        
  thresholds: {
    http_req_failed:   ['rate<0.01'],    
    http_req_duration: ['p(95)<400'],    
  },
};

const BASE =  'http://localhost:4000';
export default function () {
  const res = http.get(`${BASE}/api/gamer/user61/profile/public`);
 
  check(res, { 'status 200': r => r.status === 200 });
  sleep(0.2);
}
