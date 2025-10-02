import { GoneException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserInfoDto } from './dto/user-info.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    async getAllUsers(): Promise<UserInfoDto[]> {
        this.logger.log(`모든 회원 조회 실행`);
        const users = await this.usersRepository.find();
        this.logger.debug(`조회된 회원 수: ${users.length}`);
        return plainToInstance(UserInfoDto, users, { excludeExtraneousValues: true }); // DTO에 @Expose 붙은 값만 응답에 포함
    }

    async getUser(id: number): Promise<UserInfoDto> {
        this.logger.log(`특정 회원 조회 실행 - id: ${id}`);
        const found = await this.getUserById(id);
        return plainToInstance(UserInfoDto, found, { excludeExtraneousValues: true }); 
    }

    async getUserById(id: number): Promise<User> {
        this.logger.log(`회원 조회 시작 - id: ${id}`);
        const found = await this.usersRepository.findOneBy({id});
        if(!found) {
            this.logger.warn(`회원 없음 - id: ${id}`, new Error().stack)
            throw new NotFoundException("존재하지 않는 회원입니다."); // 404 NotFound
        }
        else if(!found.isActive) {
            this.logger.warn(`탈퇴한 회원 접근 - id: ${id}`, new Error().stack);
            throw new GoneException("탈퇴한 회원입니다."); // 410 Gone
        }
        this.logger.log(`회원 조회 성공 - id: ${id}`);
        this.logger.debug(`회원 조회 결과 -  name: ${found.name}, email: ${found.email}`)
        return found;
    }

    async createUser(createUserDto: CreateUserDto): Promise<void> {
        this.logger.log(`회원 가입 실행 - email: ${createUserDto.email}`);
        const user = this.usersRepository.create(createUserDto);
        await this.usersRepository.save(user);
        this.logger.log(`회원 가입 완료 - id: ${user.id}, email: ${user.email}`);
    }

    // soft delete (isActive = false)
    async removeUser(id: number): Promise<void> {
        this.logger.log(`회원 탈퇴 실행 - id: ${id}`);
        const found = await this.getUserById(id);
        await this.usersRepository.update(found.id, { isActive: false });
        this.logger.log(`회원 탈퇴 완료 - id: ${id}`);
    }
}
