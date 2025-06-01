import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  // Property yang kurang berdasarkan UsersService
  async findOne(options: any): Promise<User | null> {
    return this.userRepository.findOne(options);
  }

  async find(options: any): Promise<User[]> {
    return this.userRepository.find(options);
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<any> {
    return this.userRepository.update(id, updateData);
  }

  async delete(id: string): Promise<any> {
    return this.userRepository.delete(id);
  }
}